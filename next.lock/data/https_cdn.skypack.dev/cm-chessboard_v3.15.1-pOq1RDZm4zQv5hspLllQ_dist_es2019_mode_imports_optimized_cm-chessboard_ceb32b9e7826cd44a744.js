const STATE = {
  waitForInputStart: 0,
  pieceClickedThreshold: 1,
  clickTo: 2,
  secondClickThreshold: 3,
  dragTo: 4,
  clickDragTo: 5,
  moveDone: 6,
  reset: 7
};
const MOVE_CANCELED_REASON = {
  secondClick: "secondClick",
  movedOutOfBoard: "movedOutOfBoard",
  draggedBack: "draggedBack",
  clickedAnotherPiece: "clickedAnotherPiece"
};
const DRAG_THRESHOLD = 4;
class ChessboardMoveInput {
  constructor(view, moveStartCallback, moveDoneCallback, moveCanceledCallback) {
    this.view = view;
    this.chessboard = view.chessboard;
    this.moveStartCallback = moveStartCallback;
    this.moveDoneCallback = moveDoneCallback;
    this.moveCanceledCallback = moveCanceledCallback;
    this.setMoveInputState(STATE.waitForInputStart);
  }
  setMoveInputState(newState, params = void 0) {
    const prevState = this.moveInputState;
    this.moveInputState = newState;
    switch (newState) {
      case STATE.waitForInputStart:
        break;
      case STATE.pieceClickedThreshold:
        if (STATE.waitForInputStart !== prevState && STATE.clickTo !== prevState) {
          throw new Error("moveInputState");
        }
        if (this.pointerMoveListener) {
          removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener);
          this.pointerMoveListener = void 0;
        }
        if (this.pointerUpListener) {
          removeEventListener(this.pointerUpListener.type, this.pointerUpListener);
          this.pointerUpListener = void 0;
        }
        this.startIndex = params.index;
        this.endIndex = void 0;
        this.movedPiece = params.piece;
        this.updateStartEndMarkers();
        this.startPoint = params.point;
        if (!this.pointerMoveListener && !this.pointerUpListener) {
          if (params.type === "mousedown") {
            this.pointerMoveListener = this.onPointerMove.bind(this);
            this.pointerMoveListener.type = "mousemove";
            addEventListener("mousemove", this.pointerMoveListener);
            this.pointerUpListener = this.onPointerUp.bind(this);
            this.pointerUpListener.type = "mouseup";
            addEventListener("mouseup", this.pointerUpListener);
          } else if (params.type === "touchstart") {
            this.pointerMoveListener = this.onPointerMove.bind(this);
            this.pointerMoveListener.type = "touchmove";
            addEventListener("touchmove", this.pointerMoveListener);
            this.pointerUpListener = this.onPointerUp.bind(this);
            this.pointerUpListener.type = "touchend";
            addEventListener("touchend", this.pointerUpListener);
          } else {
            throw Error("event type");
          }
        } else {
          throw Error("_pointerMoveListener or _pointerUpListener");
        }
        break;
      case STATE.clickTo:
        if (this.draggablePiece) {
          Svg.removeElement(this.draggablePiece);
          this.draggablePiece = void 0;
        }
        if (prevState === STATE.dragTo) {
          this.view.setPieceVisibility(params.index);
        }
        break;
      case STATE.secondClickThreshold:
        if (STATE.clickTo !== prevState) {
          throw new Error("moveInputState");
        }
        this.startPoint = params.point;
        break;
      case STATE.dragTo:
        if (STATE.pieceClickedThreshold !== prevState) {
          throw new Error("moveInputState");
        }
        if (this.view.chessboard.state.inputEnabled) {
          this.view.setPieceVisibility(params.index, false);
          this.createDraggablePiece(params.piece);
        }
        break;
      case STATE.clickDragTo:
        if (STATE.secondClickThreshold !== prevState) {
          throw new Error("moveInputState");
        }
        if (this.view.chessboard.state.inputEnabled) {
          this.view.setPieceVisibility(params.index, false);
          this.createDraggablePiece(params.piece);
        }
        break;
      case STATE.moveDone:
        if ([STATE.dragTo, STATE.clickTo, STATE.clickDragTo].indexOf(prevState) === -1) {
          throw new Error("moveInputState");
        }
        this.endIndex = params.index;
        if (this.endIndex && this.moveDoneCallback(this.startIndex, this.endIndex)) {
          const prevSquares = this.chessboard.state.squares.slice(0);
          this.chessboard.state.setPiece(this.startIndex, void 0);
          this.chessboard.state.setPiece(this.endIndex, this.movedPiece);
          if (prevState === STATE.clickTo) {
            this.updateStartEndMarkers();
            this.view.animatePieces(prevSquares, this.chessboard.state.squares.slice(0), () => {
              this.setMoveInputState(STATE.reset);
            });
          } else {
            this.view.drawPieces(this.chessboard.state.squares);
            this.setMoveInputState(STATE.reset);
          }
        } else {
          this.view.drawPieces();
          this.setMoveInputState(STATE.reset);
        }
        break;
      case STATE.reset:
        if (this.startIndex && !this.endIndex && this.movedPiece) {
          this.chessboard.state.setPiece(this.startIndex, this.movedPiece);
        }
        this.startIndex = void 0;
        this.endIndex = void 0;
        this.movedPiece = void 0;
        this.updateStartEndMarkers();
        if (this.draggablePiece) {
          Svg.removeElement(this.draggablePiece);
          this.draggablePiece = void 0;
        }
        if (this.pointerMoveListener) {
          removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener);
          this.pointerMoveListener = void 0;
        }
        if (this.pointerUpListener) {
          removeEventListener(this.pointerUpListener.type, this.pointerUpListener);
          this.pointerUpListener = void 0;
        }
        this.setMoveInputState(STATE.waitForInputStart);
        break;
      default:
        throw Error(`moveInputState ${newState}`);
    }
  }
  createDraggablePiece(pieceName) {
    if (this.draggablePiece) {
      throw Error("draggablePiece exists");
    }
    this.draggablePiece = Svg.createSvg(document.body);
    this.draggablePiece.classList.add("cm-chessboard-draggable-piece");
    this.draggablePiece.setAttribute("width", this.view.squareWidth);
    this.draggablePiece.setAttribute("height", this.view.squareHeight);
    this.draggablePiece.setAttribute("style", "pointer-events: none");
    this.draggablePiece.name = pieceName;
    const spriteUrl = this.chessboard.props.sprite.cache ? "" : this.chessboard.props.sprite.url;
    const piece = Svg.addElement(this.draggablePiece, "use", {
      href: `${spriteUrl}#${pieceName}`
    });
    const scaling = this.view.squareHeight / this.chessboard.props.sprite.size;
    const transformScale = this.draggablePiece.createSVGTransform();
    transformScale.setScale(scaling, scaling);
    piece.transform.baseVal.appendItem(transformScale);
  }
  moveDraggablePiece(x, y) {
    this.draggablePiece.setAttribute("style", `pointer-events: none; position: absolute; left: ${x - this.view.squareHeight / 2}px; top: ${y - this.view.squareHeight / 2}px`);
  }
  onPointerDown(e) {
    if (e.type === "mousedown" && e.button === 0 || e.type === "touchstart") {
      const index = e.target.getAttribute("data-index");
      const pieceElement = this.view.getPiece(index);
      let pieceName, color;
      if (pieceElement) {
        pieceName = pieceElement.getAttribute("data-piece");
        color = pieceName ? pieceName.substr(0, 1) : void 0;
        if (color === "w" && this.chessboard.state.inputWhiteEnabled || color === "b" && this.chessboard.state.inputBlackEnabled) {
          e.preventDefault();
        }
      }
      if (index) {
        if (this.moveInputState !== STATE.waitForInputStart || this.chessboard.state.inputWhiteEnabled && color === "w" || this.chessboard.state.inputBlackEnabled && color === "b") {
          let point;
          if (e.type === "mousedown") {
            point = {x: e.clientX, y: e.clientY};
          } else if (e.type === "touchstart") {
            point = {x: e.touches[0].clientX, y: e.touches[0].clientY};
          }
          if (this.moveInputState === STATE.waitForInputStart && pieceName && this.moveStartCallback(index)) {
            this.setMoveInputState(STATE.pieceClickedThreshold, {
              index,
              piece: pieceName,
              point,
              type: e.type
            });
          } else if (this.moveInputState === STATE.clickTo) {
            if (index === this.startIndex) {
              this.setMoveInputState(STATE.secondClickThreshold, {
                index,
                piece: pieceName,
                point,
                type: e.type
              });
            } else {
              const pieceName2 = this.chessboard.getPiece(SQUARE_COORDINATES[index]);
              const pieceColor = pieceName2 ? pieceName2.substr(0, 1) : void 0;
              const startPieceName = this.chessboard.getPiece(SQUARE_COORDINATES[this.startIndex]);
              const startPieceColor = startPieceName ? startPieceName.substr(0, 1) : void 0;
              if (color && startPieceColor === pieceColor) {
                this.moveCanceledCallback(MOVE_CANCELED_REASON.clickedAnotherPiece, this.startIndex, index);
                if (this.moveStartCallback(index)) {
                  this.setMoveInputState(STATE.pieceClickedThreshold, {
                    index,
                    piece: pieceName2,
                    point,
                    type: e.type
                  });
                } else {
                  this.setMoveInputState(STATE.reset);
                }
              } else {
                this.setMoveInputState(STATE.moveDone, {index});
              }
            }
          }
        }
      }
    }
  }
  onPointerMove(e) {
    let pageX, pageY, clientX, clientY, target;
    if (e.type === "mousemove") {
      clientX = e.clientX;
      clientY = e.clientY;
      pageX = e.pageX;
      pageY = e.pageY;
      target = e.target;
    } else if (e.type === "touchmove") {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      pageX = e.touches[0].pageX;
      pageY = e.touches[0].pageY;
      target = document.elementFromPoint(clientX, clientY);
    }
    if (this.moveInputState === STATE.pieceClickedThreshold || this.moveInputState === STATE.secondClickThreshold) {
      if (Math.abs(this.startPoint.x - clientX) > DRAG_THRESHOLD || Math.abs(this.startPoint.y - clientY) > DRAG_THRESHOLD) {
        if (this.moveInputState === STATE.secondClickThreshold) {
          this.setMoveInputState(STATE.clickDragTo, {index: this.startIndex, piece: this.movedPiece});
        } else {
          this.setMoveInputState(STATE.dragTo, {index: this.startIndex, piece: this.movedPiece});
        }
        if (this.view.chessboard.state.inputEnabled) {
          this.moveDraggablePiece(pageX, pageY);
        }
      }
    } else if (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo || this.moveInputState === STATE.clickTo) {
      if (target && target.getAttribute && target.parentElement === this.view.boardGroup) {
        const index = target.getAttribute("data-index");
        if (index !== this.startIndex && index !== this.endIndex) {
          this.endIndex = index;
          this.updateStartEndMarkers();
        } else if (index === this.startIndex && this.endIndex !== void 0) {
          this.endIndex = void 0;
          this.updateStartEndMarkers();
        }
      } else {
        if (this.endIndex !== void 0) {
          this.endIndex = void 0;
          this.updateStartEndMarkers();
        }
      }
      if (this.view.chessboard.state.inputEnabled && (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo)) {
        this.moveDraggablePiece(pageX, pageY);
      }
    }
  }
  onPointerUp(e) {
    let target;
    if (e.type === "mouseup") {
      target = e.target;
    } else if (e.type === "touchend") {
      target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
    if (target && target.getAttribute) {
      const index = target.getAttribute("data-index");
      if (index) {
        if (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo) {
          if (this.startIndex === index) {
            if (this.moveInputState === STATE.clickDragTo) {
              this.chessboard.state.setPiece(this.startIndex, this.movedPiece);
              this.view.setPieceVisibility(this.startIndex);
              this.moveCanceledCallback(MOVE_CANCELED_REASON.draggedBack, index, index);
              this.setMoveInputState(STATE.reset);
            } else {
              this.setMoveInputState(STATE.clickTo, {index});
            }
          } else {
            this.setMoveInputState(STATE.moveDone, {index});
          }
        } else if (this.moveInputState === STATE.pieceClickedThreshold) {
          this.setMoveInputState(STATE.clickTo, {index});
        } else if (this.moveInputState === STATE.secondClickThreshold) {
          this.setMoveInputState(STATE.reset);
          this.moveCanceledCallback(MOVE_CANCELED_REASON.secondClick, index, index);
        }
      } else {
        this.view.drawPieces();
        const moveStartIndex = this.startIndex;
        this.setMoveInputState(STATE.reset);
        this.moveCanceledCallback(MOVE_CANCELED_REASON.movedOutOfBoard, moveStartIndex, void 0);
      }
    } else {
      this.view.drawPieces();
      this.setMoveInputState(STATE.reset);
    }
  }
  updateStartEndMarkers() {
    if (this.chessboard.props.style.moveFromMarker) {
      this.chessboard.state.removeMarkers(void 0, this.chessboard.props.style.moveFromMarker);
    }
    if (this.chessboard.props.style.moveToMarker) {
      this.chessboard.state.removeMarkers(void 0, this.chessboard.props.style.moveToMarker);
    }
    if (this.chessboard.props.style.moveFromMarker) {
      if (this.startIndex) {
        this.chessboard.state.addMarker(this.startIndex, this.chessboard.props.style.moveFromMarker);
      }
    }
    if (this.chessboard.props.style.moveToMarker) {
      if (this.endIndex) {
        this.chessboard.state.addMarker(this.endIndex, this.chessboard.props.style.moveToMarker);
      }
    }
    this.view.drawMarkers();
  }
  reset() {
    this.setMoveInputState(STATE.reset);
  }
  destroy() {
    this.reset();
  }
}
const CHANGE_TYPE = {
  move: 0,
  appear: 1,
  disappear: 2
};
class ChessboardPiecesAnimation {
  constructor(view, fromSquares, toSquares, duration, callback) {
    this.view = view;
    if (fromSquares && toSquares) {
      this.animatedElements = this.createAnimation(fromSquares, toSquares);
      this.duration = duration;
      this.callback = callback;
      this.frameHandle = requestAnimationFrame(this.animationStep.bind(this));
    }
  }
  seekChanges(fromSquares, toSquares) {
    const appearedList = [], disappearedList = [], changes = [];
    for (let i = 0; i < 64; i++) {
      const previousSquare = fromSquares[i];
      const newSquare = toSquares[i];
      if (newSquare !== previousSquare) {
        if (newSquare) {
          appearedList.push({piece: newSquare, index: i});
        }
        if (previousSquare) {
          disappearedList.push({piece: previousSquare, index: i});
        }
      }
    }
    appearedList.forEach((appeared) => {
      let shortestDistance = 8;
      let foundMoved = void 0;
      disappearedList.forEach((disappeared) => {
        if (appeared.piece === disappeared.piece) {
          const moveDistance = this.squareDistance(appeared.index, disappeared.index);
          if (moveDistance < shortestDistance) {
            foundMoved = disappeared;
            shortestDistance = moveDistance;
          }
        }
      });
      if (foundMoved) {
        disappearedList.splice(disappearedList.indexOf(foundMoved), 1);
        changes.push({
          type: CHANGE_TYPE.move,
          piece: appeared.piece,
          atIndex: foundMoved.index,
          toIndex: appeared.index
        });
      } else {
        changes.push({type: CHANGE_TYPE.appear, piece: appeared.piece, atIndex: appeared.index});
      }
    });
    disappearedList.forEach((disappeared) => {
      changes.push({type: CHANGE_TYPE.disappear, piece: disappeared.piece, atIndex: disappeared.index});
    });
    return changes;
  }
  createAnimation(fromSquares, toSquares) {
    const changes = this.seekChanges(fromSquares, toSquares);
    const animatedElements = [];
    changes.forEach((change) => {
      const animatedItem = {
        type: change.type
      };
      switch (change.type) {
        case CHANGE_TYPE.move:
          animatedItem.element = this.view.getPiece(change.atIndex);
          animatedItem.atPoint = this.view.squareIndexToPoint(change.atIndex);
          animatedItem.toPoint = this.view.squareIndexToPoint(change.toIndex);
          break;
        case CHANGE_TYPE.appear:
          animatedItem.element = this.view.drawPiece(change.atIndex, change.piece);
          animatedItem.element.style.opacity = 0;
          break;
        case CHANGE_TYPE.disappear:
          animatedItem.element = this.view.getPiece(change.atIndex);
          break;
      }
      animatedElements.push(animatedItem);
    });
    return animatedElements;
  }
  animationStep(time) {
    if (!this.startTime) {
      this.startTime = time;
    }
    const timeDiff = time - this.startTime;
    if (timeDiff <= this.duration) {
      this.frameHandle = requestAnimationFrame(this.animationStep.bind(this));
    } else {
      cancelAnimationFrame(this.frameHandle);
      this.callback();
      return;
    }
    const t = Math.min(1, timeDiff / this.duration);
    const progress = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    this.animatedElements.forEach((animatedItem) => {
      if (animatedItem.element) {
        switch (animatedItem.type) {
          case CHANGE_TYPE.move:
            animatedItem.element.transform.baseVal.removeItem(0);
            const transform = this.view.svg.createSVGTransform();
            transform.setTranslate(animatedItem.atPoint.x + (animatedItem.toPoint.x - animatedItem.atPoint.x) * progress, animatedItem.atPoint.y + (animatedItem.toPoint.y - animatedItem.atPoint.y) * progress);
            animatedItem.element.transform.baseVal.appendItem(transform);
            break;
          case CHANGE_TYPE.appear:
            animatedItem.element.style.opacity = progress;
            break;
          case CHANGE_TYPE.disappear:
            animatedItem.element.style.opacity = 1 - progress;
            break;
        }
      } else {
        console.warn("animatedItem has no element", animatedItem);
      }
    });
  }
  squareDistance(index1, index2) {
    const file1 = index1 % 8;
    const rank1 = Math.floor(index1 / 8);
    const file2 = index2 % 8;
    const rank2 = Math.floor(index2 / 8);
    return Math.max(Math.abs(rank2 - rank1), Math.abs(file2 - file1));
  }
}
const SQUARE_COORDINATES = [
  "a1",
  "b1",
  "c1",
  "d1",
  "e1",
  "f1",
  "g1",
  "h1",
  "a2",
  "b2",
  "c2",
  "d2",
  "e2",
  "f2",
  "g2",
  "h2",
  "a3",
  "b3",
  "c3",
  "d3",
  "e3",
  "f3",
  "g3",
  "h3",
  "a4",
  "b4",
  "c4",
  "d4",
  "e4",
  "f4",
  "g4",
  "h4",
  "a5",
  "b5",
  "c5",
  "d5",
  "e5",
  "f5",
  "g5",
  "h5",
  "a6",
  "b6",
  "c6",
  "d6",
  "e6",
  "f6",
  "g6",
  "h6",
  "a7",
  "b7",
  "c7",
  "d7",
  "e7",
  "f7",
  "g7",
  "h7",
  "a8",
  "b8",
  "c8",
  "d8",
  "e8",
  "f8",
  "g8",
  "h8"
];
class ChessboardView {
  constructor(chessboard, callbackAfterCreation) {
    this.animationRunning = false;
    this.currentAnimation = void 0;
    this.chessboard = chessboard;
    this.moveInput = new ChessboardMoveInput(this, this.moveStartCallback.bind(this), this.moveDoneCallback.bind(this), this.moveCanceledCallback.bind(this));
    this.animationQueue = [];
    if (chessboard.props.sprite.cache) {
      this.cacheSprite();
    }
    if (chessboard.props.responsive) {
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => {
          this.handleResize();
        });
        this.resizeObserver.observe(this.chessboard.element);
      } else {
        this.resizeListener = this.handleResize.bind(this);
        window.addEventListener("resize", this.resizeListener);
      }
    }
    this.pointerDownListener = this.pointerDownHandler.bind(this);
    this.chessboard.element.addEventListener("mousedown", this.pointerDownListener);
    this.chessboard.element.addEventListener("touchstart", this.pointerDownListener);
    this.createSvgAndGroups();
    this.updateMetrics();
    callbackAfterCreation(this);
    if (chessboard.props.responsive) {
      this.handleResize();
    }
  }
  pointerDownHandler(e) {
    this.moveInput.onPointerDown(e);
  }
  destroy() {
    this.moveInput.destroy();
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.chessboard.element);
    }
    if (this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener);
    }
    this.chessboard.element.removeEventListener("mousedown", this.pointerDownListener);
    this.chessboard.element.removeEventListener("touchstart", this.pointerDownListener);
    Svg.removeElement(this.svg);
    this.animationQueue = [];
    if (this.currentAnimation) {
      cancelAnimationFrame(this.currentAnimation.frameHandle);
    }
  }
  cacheSprite() {
    const wrapperId = "chessboardSpriteCache";
    if (!document.getElementById(wrapperId)) {
      const wrapper = document.createElement("div");
      wrapper.style.display = "none";
      wrapper.id = wrapperId;
      document.body.appendChild(wrapper);
      const xhr = new XMLHttpRequest();
      xhr.open("GET", this.chessboard.props.sprite.url, true);
      xhr.onload = function() {
        wrapper.insertAdjacentHTML("afterbegin", xhr.response);
      };
      xhr.send();
    }
  }
  createSvgAndGroups() {
    if (this.svg) {
      Svg.removeElement(this.svg);
    }
    this.svg = Svg.createSvg(this.chessboard.element);
    let cssClass = this.chessboard.props.style.cssClass ? this.chessboard.props.style.cssClass : "default";
    this.svg.setAttribute("class", "cm-chessboard border-type-" + this.chessboard.props.style.borderType + " " + cssClass);
    this.updateMetrics();
    this.boardGroup = Svg.addElement(this.svg, "g", {class: "board"});
    this.coordinatesGroup = Svg.addElement(this.svg, "g", {class: "coordinates"});
    this.markersGroup = Svg.addElement(this.svg, "g", {class: "markers"});
    this.piecesGroup = Svg.addElement(this.svg, "g", {class: "pieces"});
  }
  updateMetrics() {
    this.width = this.chessboard.element.clientWidth;
    this.height = this.chessboard.element.clientHeight;
    if (this.chessboard.props.style.borderType === BORDER_TYPE.frame) {
      this.borderSize = this.width / 25;
    } else if (this.chessboard.props.style.borderType === BORDER_TYPE.thin) {
      this.borderSize = this.width / 320;
    } else {
      this.borderSize = 0;
    }
    this.innerWidth = this.width - 2 * this.borderSize;
    this.innerHeight = this.height - 2 * this.borderSize;
    this.squareWidth = this.innerWidth / 8;
    this.squareHeight = this.innerHeight / 8;
    this.scalingX = this.squareWidth / this.chessboard.props.sprite.size;
    this.scalingY = this.squareHeight / this.chessboard.props.sprite.size;
    this.pieceXTranslate = this.squareWidth / 2 - this.chessboard.props.sprite.size * this.scalingY / 2;
  }
  handleResize() {
    if (this.chessboard.props.style.aspectRatio) {
      this.chessboard.element.style.height = this.chessboard.element.clientWidth * this.chessboard.props.style.aspectRatio + "px";
    }
    if (this.chessboard.element.clientWidth !== this.width || this.chessboard.element.clientHeight !== this.height) {
      this.updateMetrics();
      this.redraw();
    }
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
  }
  redraw() {
    this.drawBoard();
    this.drawCoordinates();
    this.drawMarkers();
    this.setCursor();
    this.drawPieces(this.chessboard.state.squares);
  }
  drawBoard() {
    while (this.boardGroup.firstChild) {
      this.boardGroup.removeChild(this.boardGroup.lastChild);
    }
    if (this.chessboard.props.style.borderType !== BORDER_TYPE.none) {
      let boardBorder = Svg.addElement(this.boardGroup, "rect", {width: this.width, height: this.height});
      boardBorder.setAttribute("class", "border");
      if (this.chessboard.props.style.borderType === BORDER_TYPE.frame) {
        const innerPos = this.borderSize;
        let borderInner = Svg.addElement(this.boardGroup, "rect", {
          x: innerPos,
          y: innerPos,
          width: this.width - innerPos * 2,
          height: this.height - innerPos * 2
        });
        borderInner.setAttribute("class", "border-inner");
      }
    }
    for (let i = 0; i < 64; i++) {
      const index = this.chessboard.state.orientation === COLOR.white ? i : 63 - i;
      const squareColor = (9 * index & 8) === 0 ? "black" : "white";
      const fieldClass = `square ${squareColor}`;
      const point = this.squareIndexToPoint(index);
      const squareRect = Svg.addElement(this.boardGroup, "rect", {
        x: point.x,
        y: point.y,
        width: this.squareWidth,
        height: this.squareHeight
      });
      squareRect.setAttribute("class", fieldClass);
      squareRect.setAttribute("data-index", "" + index);
    }
  }
  drawCoordinates() {
    if (!this.chessboard.props.style.showCoordinates) {
      return;
    }
    while (this.coordinatesGroup.firstChild) {
      this.coordinatesGroup.removeChild(this.coordinatesGroup.lastChild);
    }
    const inline = this.chessboard.props.style.borderType !== BORDER_TYPE.frame;
    for (let file = 0; file < 8; file++) {
      let x = this.borderSize + (17 + this.chessboard.props.sprite.size * file) * this.scalingX;
      let y = this.height - this.scalingY * 3.5;
      let cssClass = "coordinate file";
      if (inline) {
        x = x + this.scalingX * 15.5;
        cssClass += file % 2 ? " white" : " black";
      }
      const textElement = Svg.addElement(this.coordinatesGroup, "text", {
        class: cssClass,
        x,
        y,
        style: `font-size: ${this.scalingY * 10}px`
      });
      if (this.chessboard.state.orientation === COLOR.white) {
        textElement.textContent = String.fromCharCode(97 + file);
      } else {
        textElement.textContent = String.fromCharCode(104 - file);
      }
    }
    for (let rank = 0; rank < 8; rank++) {
      let x = this.borderSize / 3.7;
      let y = this.borderSize + 25 * this.scalingY + rank * this.squareHeight;
      let cssClass = "coordinate rank";
      if (inline) {
        cssClass += rank % 2 ? " black" : " white";
        if (this.chessboard.props.style.borderType === BORDER_TYPE.frame) {
          x = x + this.scalingX * 10;
          y = y - this.scalingY * 15;
        } else {
          x = x + this.scalingX * 2;
          y = y - this.scalingY * 15;
        }
      }
      const textElement = Svg.addElement(this.coordinatesGroup, "text", {
        class: cssClass,
        x,
        y,
        style: `font-size: ${this.scalingY * 10}px`
      });
      if (this.chessboard.state.orientation === COLOR.white) {
        textElement.textContent = "" + (8 - rank);
      } else {
        textElement.textContent = "" + (1 + rank);
      }
    }
  }
  drawPieces(squares = this.chessboard.state.squares) {
    const childNodes = Array.from(this.piecesGroup.childNodes);
    for (let i = 0; i < 64; i++) {
      const pieceName = squares[i];
      if (pieceName) {
        this.drawPiece(i, pieceName);
      }
    }
    for (const childNode of childNodes) {
      this.piecesGroup.removeChild(childNode);
    }
  }
  drawPiece(index, pieceName) {
    const pieceGroup = Svg.addElement(this.piecesGroup, "g");
    pieceGroup.setAttribute("data-piece", pieceName);
    pieceGroup.setAttribute("data-index", index);
    const point = this.squareIndexToPoint(index);
    const transform = this.svg.createSVGTransform();
    transform.setTranslate(point.x, point.y);
    pieceGroup.transform.baseVal.appendItem(transform);
    const spriteUrl = this.chessboard.props.sprite.cache ? "" : this.chessboard.props.sprite.url;
    const pieceUse = Svg.addElement(pieceGroup, "use", {
      href: `${spriteUrl}#${pieceName}`,
      class: "piece"
    });
    const transformTranslate = this.svg.createSVGTransform();
    transformTranslate.setTranslate(this.pieceXTranslate, 0);
    pieceUse.transform.baseVal.appendItem(transformTranslate);
    const transformScale = this.svg.createSVGTransform();
    transformScale.setScale(this.scalingY, this.scalingY);
    pieceUse.transform.baseVal.appendItem(transformScale);
    return pieceGroup;
  }
  setPieceVisibility(index, visible = true) {
    const piece = this.getPiece(index);
    if (visible) {
      piece.setAttribute("visibility", "visible");
    } else {
      piece.setAttribute("visibility", "hidden");
    }
  }
  getPiece(index) {
    return this.piecesGroup.querySelector(`g[data-index='${index}']`);
  }
  drawMarkers() {
    while (this.markersGroup.firstChild) {
      this.markersGroup.removeChild(this.markersGroup.firstChild);
    }
    this.chessboard.state.markers.forEach((marker) => {
      this.drawMarker(marker);
    });
  }
  drawMarker(marker) {
    const markerGroup = Svg.addElement(this.markersGroup, "g");
    markerGroup.setAttribute("data-index", marker.index);
    const point = this.squareIndexToPoint(marker.index);
    const transform = this.svg.createSVGTransform();
    transform.setTranslate(point.x, point.y);
    markerGroup.transform.baseVal.appendItem(transform);
    const spriteUrl = this.chessboard.props.sprite.cache ? "" : this.chessboard.props.sprite.url;
    const markerUse = Svg.addElement(markerGroup, "use", {href: `${spriteUrl}#${marker.type.slice}`, class: "marker " + marker.type.class});
    const transformScale = this.svg.createSVGTransform();
    transformScale.setScale(this.scalingX, this.scalingY);
    markerUse.transform.baseVal.appendItem(transformScale);
    return markerGroup;
  }
  animatePieces(fromSquares, toSquares, callback) {
    this.animationQueue.push({fromSquares, toSquares, callback});
    if (!this.animationRunning) {
      this.nextPieceAnimationInQueue();
    }
  }
  nextPieceAnimationInQueue() {
    const nextAnimation = this.animationQueue.shift();
    if (nextAnimation !== void 0) {
      this.animationRunning = true;
      this.currentAnimation = new ChessboardPiecesAnimation(this, nextAnimation.fromSquares, nextAnimation.toSquares, this.chessboard.props.animationDuration / (this.animationQueue.length + 1), () => {
        if (!this.moveInput.draggablePiece) {
          this.drawPieces(nextAnimation.toSquares);
          this.animationRunning = false;
          this.nextPieceAnimationInQueue();
          if (nextAnimation.callback) {
            nextAnimation.callback();
          }
        } else {
          this.animationRunning = false;
          this.nextPieceAnimationInQueue();
          if (nextAnimation.callback) {
            nextAnimation.callback();
          }
        }
      });
    }
  }
  enableMoveInput(eventHandler, color = void 0) {
    if (color === COLOR.white) {
      this.chessboard.state.inputWhiteEnabled = true;
    } else if (color === COLOR.black) {
      this.chessboard.state.inputBlackEnabled = true;
    } else {
      this.chessboard.state.inputWhiteEnabled = true;
      this.chessboard.state.inputBlackEnabled = true;
    }
    this.chessboard.state.inputEnabled = true;
    this.moveInputCallback = eventHandler;
    this.setCursor();
  }
  disableMoveInput() {
    this.chessboard.state.inputWhiteEnabled = false;
    this.chessboard.state.inputBlackEnabled = false;
    this.chessboard.state.inputEnabled = false;
    this.moveInputCallback = void 0;
    this.setCursor();
  }
  moveStartCallback(index) {
    if (this.moveInputCallback) {
      return this.moveInputCallback({
        chessboard: this.chessboard,
        type: INPUT_EVENT_TYPE.moveStart,
        square: SQUARE_COORDINATES[index]
      });
    } else {
      return true;
    }
  }
  moveDoneCallback(fromIndex, toIndex) {
    if (this.moveInputCallback) {
      return this.moveInputCallback({
        chessboard: this.chessboard,
        type: INPUT_EVENT_TYPE.moveDone,
        squareFrom: SQUARE_COORDINATES[fromIndex],
        squareTo: SQUARE_COORDINATES[toIndex]
      });
    } else {
      return true;
    }
  }
  moveCanceledCallback(reason, fromIndex, toIndex) {
    if (this.moveInputCallback) {
      this.moveInputCallback({
        chessboard: this.chessboard,
        type: INPUT_EVENT_TYPE.moveCanceled,
        reason,
        squareFrom: SQUARE_COORDINATES[fromIndex],
        squareTo: toIndex ? SQUARE_COORDINATES[toIndex] : void 0
      });
    }
  }
  setCursor() {
    if (this.chessboard.state) {
      if (this.chessboard.state.inputWhiteEnabled || this.chessboard.state.inputBlackEnabled || this.chessboard.state.squareSelectEnabled) {
        this.boardGroup.setAttribute("class", "board input-enabled");
      } else {
        this.boardGroup.setAttribute("class", "board");
      }
    }
  }
  squareIndexToPoint(index) {
    let x, y;
    if (this.chessboard.state.orientation === COLOR.white) {
      x = this.borderSize + index % 8 * this.squareWidth;
      y = this.borderSize + (7 - Math.floor(index / 8)) * this.squareHeight;
    } else {
      x = this.borderSize + (7 - index % 8) * this.squareWidth;
      y = this.borderSize + Math.floor(index / 8) * this.squareHeight;
    }
    return {x, y};
  }
}
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
class Svg {
  static createSvg(containerElement = void 0) {
    let svg = document.createElementNS(SVG_NAMESPACE, "svg");
    if (containerElement) {
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      containerElement.appendChild(svg);
    }
    return svg;
  }
  static addElement(parent, name, attributes) {
    let element = document.createElementNS(SVG_NAMESPACE, name);
    if (name === "use") {
      attributes["xlink:href"] = attributes["href"];
    }
    for (let attribute in attributes) {
      if (attributes.hasOwnProperty(attribute)) {
        if (attribute.indexOf(":") !== -1) {
          const value = attribute.split(":");
          element.setAttributeNS("http://www.w3.org/1999/" + value[0], value[1], attributes[attribute]);
        } else {
          element.setAttribute(attribute, attributes[attribute]);
        }
      }
    }
    parent.appendChild(element);
    return element;
  }
  static removeElement(element) {
    element.parentNode.removeChild(element);
  }
}
class ChessboardState {
  constructor() {
    this.squares = new Array(64).fill(void 0);
    this.orientation = void 0;
    this.markers = [];
    this.inputWhiteEnabled = false;
    this.inputBlackEnabled = false;
    this.inputEnabled = false;
    this.squareSelectEnabled = false;
  }
  setPiece(index, piece) {
    this.squares[index] = piece;
  }
  addMarker(index, type) {
    this.markers.push({index, type});
  }
  removeMarkers(index = void 0, type = void 0) {
    if (!index && !type) {
      this.markers = [];
    } else {
      this.markers = this.markers.filter((marker) => {
        if (!marker.type) {
          if (index === marker.index) {
            return false;
          }
        } else if (!index) {
          if (marker.type === type) {
            return false;
          }
        } else if (marker.type === type && index === marker.index) {
          return false;
        }
        return true;
      });
    }
  }
  setPosition(fen) {
    if (fen) {
      const parts = fen.replace(/^\s*/, "").replace(/\s*$/, "").split(/\/|\s/);
      for (let part = 0; part < 8; part++) {
        const row = parts[7 - part].replace(/\d/g, (str) => {
          const numSpaces = parseInt(str);
          let ret = "";
          for (let i = 0; i < numSpaces; i++) {
            ret += "-";
          }
          return ret;
        });
        for (let c = 0; c < 8; c++) {
          const char = row.substr(c, 1);
          let piece = void 0;
          if (char !== "-") {
            if (char.toUpperCase() === char) {
              piece = `w${char.toLowerCase()}`;
            } else {
              piece = `b${char}`;
            }
          }
          this.squares[part * 8 + c] = piece;
        }
      }
    }
  }
  getPosition() {
    let parts = new Array(8).fill("");
    for (let part = 0; part < 8; part++) {
      let spaceCounter = 0;
      for (let i = 0; i < 8; i++) {
        const piece = this.squares[part * 8 + i];
        if (!piece) {
          spaceCounter++;
        } else {
          if (spaceCounter > 0) {
            parts[7 - part] += spaceCounter;
            spaceCounter = 0;
          }
          const color = piece.substr(0, 1);
          const name = piece.substr(1, 1);
          if (color === "w") {
            parts[7 - part] += name.toUpperCase();
          } else {
            parts[7 - part] += name;
          }
        }
      }
      if (spaceCounter > 0) {
        parts[7 - part] += spaceCounter;
        spaceCounter = 0;
      }
    }
    return parts.join("/");
  }
  squareToIndex(square) {
    const file = square.substr(0, 1).charCodeAt(0) - 97;
    const rank = square.substr(1, 1) - 1;
    return 8 * rank + file;
  }
}
const COLOR = {
  white: "w",
  black: "b"
};
const INPUT_EVENT_TYPE = {
  moveStart: "moveStart",
  moveDone: "moveDone",
  moveCanceled: "moveCanceled"
};
const SQUARE_SELECT_TYPE = {
  primary: "primary",
  secondary: "secondary"
};
const BORDER_TYPE = {
  none: "none",
  thin: "thin",
  frame: "frame"
};
const MARKER_TYPE = {
  frame: {class: "marker-frame", slice: "markerFrame"},
  square: {class: "marker-square", slice: "markerSquare"},
  dot: {class: "marker-dot", slice: "markerDot"},
  circle: {class: "marker-circle", slice: "markerCircle"}
};
const PIECE = {
  wp: "wp",
  wb: "wb",
  wn: "wn",
  wr: "wr",
  wq: "wq",
  wk: "wk",
  bp: "bp",
  bb: "bb",
  bn: "bn",
  br: "br",
  bq: "bq",
  bk: "bk"
};
const FEN_START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const FEN_EMPTY_POSITION = "8/8/8/8/8/8/8/8";
class Chessboard {
  constructor(element, props = {}) {
    if (!element) {
      throw new Error("container element is " + element);
    }
    this.element = element;
    let defaultProps = {
      position: "empty",
      orientation: COLOR.white,
      style: {
        cssClass: "default",
        showCoordinates: true,
        borderType: BORDER_TYPE.thin,
        aspectRatio: 1,
        moveFromMarker: MARKER_TYPE.frame,
        moveToMarker: MARKER_TYPE.frame,
        moveMarker: MARKER_TYPE.frame,
        hoverMarker: MARKER_TYPE.frame
      },
      responsive: true,
      animationDuration: 300,
      sprite: {
        url: "./assets/images/chessboard-sprite-staunty.svg",
        size: 40,
        cache: true
      }
    };
    this.props = {};
    Object.assign(this.props, defaultProps);
    Object.assign(this.props, props);
    this.props.sprite = defaultProps.sprite;
    this.props.style = defaultProps.style;
    if (props.sprite) {
      Object.assign(this.props.sprite, props.sprite);
    }
    if (props.style) {
      Object.assign(this.props.style, props.style);
    }
    if (this.props.style.moveMarker !== MARKER_TYPE.frame) {
      console.warn("this.props.style.moveMarker is deprecated, use this.props.style.moveFromMarker");
      this.props.style.moveFromMarker = this.props.style.moveMarker;
    }
    if (this.props.style.hoverMarker !== MARKER_TYPE.frame) {
      console.warn("this.props.style.hoverMarker is deprecated, use this.props.style.moveToMarker");
      this.props.style.moveToMarker = this.props.style.hoverMarker;
    }
    if (this.props.style.aspectRatio) {
      this.element.style.height = this.element.offsetWidth * this.props.style.aspectRatio + "px";
    }
    this.state = new ChessboardState();
    this.state.orientation = this.props.orientation;
    this.view = new ChessboardView(this, (view) => {
      if (this.props.position === "start") {
        this.state.setPosition(FEN_START_POSITION);
      } else if (this.props.position === "empty" || this.props.position === void 0) {
        this.state.setPosition(FEN_EMPTY_POSITION);
      } else {
        this.state.setPosition(this.props.position);
      }
      view.redraw();
    });
  }
  setPiece(square, piece) {
    this.state.setPiece(this.state.squareToIndex(square), piece);
    this.view.drawPieces(this.state.squares);
  }
  getPiece(square) {
    return this.state.squares[this.state.squareToIndex(square)];
  }
  setPosition(fen, animated = true) {
    return new Promise((resolve) => {
      if (fen === "start") {
        fen = FEN_START_POSITION;
      } else if (fen === "empty") {
        fen = FEN_EMPTY_POSITION;
      }
      const currentFen = this.state.getPosition();
      const fenParts = fen.split(" ");
      const fenNormalized = fenParts[0];
      if (fenNormalized !== currentFen) {
        const prevSquares = this.state.squares.slice(0);
        this.state.setPosition(fen);
        if (animated) {
          this.view.animatePieces(prevSquares, this.state.squares.slice(0), () => {
            resolve();
          });
        } else {
          this.view.drawPieces(this.state.squares);
          resolve();
        }
      } else {
        resolve();
      }
    });
  }
  getPosition() {
    return this.state.getPosition();
  }
  addMarker(square, type) {
    if (!type) {
      console.error("Error addMarker(), type is " + type);
    }
    this.state.addMarker(this.state.squareToIndex(square), type);
    this.view.drawMarkers();
  }
  getMarkers(square = void 0, type = void 0) {
    const markersFound = [];
    this.state.markers.forEach((marker) => {
      const markerSquare = SQUARE_COORDINATES[marker.index];
      if (!square && (!type || type === marker.type) || !type && square === markerSquare || type === marker.type && square === markerSquare) {
        markersFound.push({square: SQUARE_COORDINATES[marker.index], type: marker.type});
      }
    });
    return markersFound;
  }
  removeMarkers(square = void 0, type = void 0) {
    const index = square ? this.state.squareToIndex(square) : void 0;
    this.state.removeMarkers(index, type);
    this.view.drawMarkers();
  }
  setOrientation(color) {
    this.state.orientation = color;
    return this.view.redraw();
  }
  getOrientation() {
    return this.state.orientation;
  }
  destroy() {
    this.view.destroy();
    this.view = void 0;
    this.state = void 0;
    if (this.squareSelectListener) {
      this.element.removeEventListener("contextmenu", this.squareSelectListener);
      this.element.removeEventListener("mouseup", this.squareSelectListener);
      this.element.removeEventListener("touchend", this.squareSelectListener);
    }
  }
  enableMoveInput(eventHandler, color = void 0) {
    this.view.enableMoveInput(eventHandler, color);
  }
  disableMoveInput() {
    this.view.disableMoveInput();
  }
  enableContextInput(eventHandler) {
    console.warn("enableContextInput() is deprecated, use enableSquareSelect()");
    this.enableSquareSelect(function(event) {
      if (event.type === SQUARE_SELECT_TYPE.secondary) {
        eventHandler(event);
      }
    });
  }
  disableContextInput() {
    this.disableSquareSelect();
  }
  enableSquareSelect(eventHandler) {
    if (this.squareSelectListener) {
      console.warn("squareSelectListener already existing");
      return;
    }
    this.squareSelectListener = function(e) {
      const index = e.target.getAttribute("data-index");
      if (e.type === "contextmenu") {
        e.preventDefault();
        return;
      }
      eventHandler({
        chessboard: this,
        type: e.button === 2 ? SQUARE_SELECT_TYPE.secondary : SQUARE_SELECT_TYPE.primary,
        square: SQUARE_COORDINATES[index]
      });
    };
    this.element.addEventListener("contextmenu", this.squareSelectListener);
    this.element.addEventListener("mouseup", this.squareSelectListener);
    this.element.addEventListener("touchend", this.squareSelectListener);
    this.state.squareSelectEnabled = true;
    this.view.setCursor();
  }
  disableSquareSelect() {
    this.element.removeEventListener("contextmenu", this.squareSelectListener);
    this.element.removeEventListener("mouseup", this.squareSelectListener);
    this.element.removeEventListener("touchend", this.squareSelectListener);
    this.squareSelectListener = void 0;
    this.state.squareSelectEnabled = false;
    this.view.setCursor();
  }
}
export {BORDER_TYPE, COLOR, Chessboard, FEN_EMPTY_POSITION, FEN_START_POSITION, INPUT_EVENT_TYPE, MARKER_TYPE, PIECE, SQUARE_SELECT_TYPE};
export default null;
