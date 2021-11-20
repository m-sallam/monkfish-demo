const EMPTY = 0;
const WHITE_PAWN = 1;
const BLACK_PAWN = -1;
const WHITE_KNIGHT = 2;
const BLACK_KNIGHT = -2;
const WHITE_BISHOP = 3;
const BLACK_BISHOP = -3;
const WHITE_ROOK = 4;
const BLACK_ROOK = -4;
const WHITE_QUEEN = 5;
const BLACK_QUEEN = -5;
const WHITE_KING = 6;
const BLACK_KING = -6;
const pieceLettersToValueMap = {
  p: BLACK_PAWN,
  P: WHITE_PAWN,
  n: BLACK_KNIGHT,
  N: WHITE_KNIGHT,
  b: BLACK_BISHOP,
  B: WHITE_BISHOP,
  r: BLACK_ROOK,
  R: WHITE_ROOK,
  q: BLACK_QUEEN,
  Q: WHITE_QUEEN,
  k: BLACK_KING,
  K: WHITE_KING
};
const pieceValueToLetterMap = Object.fromEntries(Object.entries(pieceLettersToValueMap).map(([key, value]) => [value, key]));
const isWhitePiece = (piece) => piece > 0;
const isBlackPiece = (piece) => piece < 0;
class FenParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "FenParseError";
  }
}
class MoveError extends Error {
  constructor(message) {
    super(message);
    this.name = "MoveError";
  }
}
const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const oppositeColor = (color) => color === "w" ? "b" : "w";
const isSquareOnRank = (square, rank) => Math.floor(square / 8) === rank;
const isSquareOnFile = (square, file) => square % 8 === file;
const isValidSquare = (square) => square >= 0 && square <= 63;
const FileNotationToFile = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  e: 4,
  f: 5,
  g: 6,
  h: 7
};
const FileToFileNotation = Object.fromEntries(Object.entries(FileNotationToFile).map(([key, value]) => [value, key]));
const RankNotationToRank = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 7
};
const RankToRankNotation = Object.fromEntries(Object.entries(RankNotationToRank).map(([key, value]) => [value, key]));
const boardPositionNotationToSquare = (position) => {
  const file = FileNotationToFile[position[0]];
  const rank = RankNotationToRank[position[1]];
  const square = rank * 8 + file;
  return square;
};
const squareToBoardPositionNotation = (square) => {
  const file = square % 8;
  const rank = Math.floor(square / 8);
  return `${FileToFileNotation[file]}${RankToRankNotation[rank]}`;
};
const printBoard = (board) => {
  console.log("                          ");
  console.log("__________________________");
  console.log("                          ");
  for (let rank = 7; rank >= 0; rank -= 1) {
    let line = "";
    for (let file = 0; file < 8; file += 1) {
      line += pieceValueToLetterMap[board[8 * rank + file]] || "-";
      line += "  ";
    }
    console.log(`${rank + 1}   ${line}`);
  }
  console.log("                          ");
  console.log("    a  b  c  d  e  f  g  h");
  console.log("__________________________");
  console.log("                          ");
};
const isBoardPositionNotationMove = (m) => {
  return typeof m.from === "string";
};
const colorOfSquare = (square) => {
  const rank = Math.floor(square / 8);
  const file = square % 8;
  const isEventRank = rank % 2 === 0;
  const isEvenFile = file % 2 === 0;
  const bothEvenOrOdd = isEventRank === isEvenFile;
  if (bothEvenOrOdd)
    return "b";
  else
    return "w";
};
var Direction;
(function(Direction2) {
  Direction2["TOP"] = "TOP";
  Direction2["BOTTOM"] = "BOTTOM";
  Direction2["RIGHT"] = "RIGHT";
  Direction2["LEFT"] = "LEFT";
  Direction2["TOP_RIGHT"] = "TOP_RIGHT";
  Direction2["TOP_LEFT"] = "TOP_LEFT";
  Direction2["BOTTOM_RIGHT"] = "BOTTOM_RIGHT";
  Direction2["BOTTOM_LEFT"] = "BOTTOM_LEFT";
})(Direction || (Direction = {}));
const applyMove = (state, move) => {
  var _a, _b, _c;
  state.board[move.from] = 0;
  state.board[move.to] = (_a = move.promotion) != null ? _a : move.piece;
  if (move.to === state.enPassant) {
    if (move.piece === WHITE_PAWN) {
      state.board[state.enPassant - 8] = 0;
      state.blackPositions[state.enPassant - 8] = 0;
    } else if (move.piece === BLACK_PAWN) {
      state.board[state.enPassant + 8] = 0;
      state.whitePositions[state.enPassant + 8] = 0;
    }
  }
  if (move.castling) {
    if (move.castling === "K") {
      if (state.sideToMove === "w") {
        state.board[7] = 0;
        state.board[5] = WHITE_ROOK;
        state.whitePositions[7] = 0;
        state.whitePositions[5] = WHITE_ROOK;
      } else {
        state.board[63] = 0;
        state.board[61] = BLACK_ROOK;
        state.blackPositions[63] = 0;
        state.blackPositions[61] = BLACK_ROOK;
      }
    } else {
      if (state.sideToMove === "w") {
        state.board[0] = 0;
        state.board[3] = WHITE_ROOK;
        state.whitePositions[0] = 0;
        state.whitePositions[3] = WHITE_ROOK;
      } else {
        state.board[56] = 0;
        state.board[59] = BLACK_ROOK;
        state.blackPositions[56] = 0;
        state.blackPositions[59] = BLACK_ROOK;
      }
    }
  }
  if (state.sideToMove === "w") {
    state.whitePositions[move.from] = 0;
    state.whitePositions[move.to] = (_b = move.promotion) != null ? _b : move.piece;
    state.blackPositions[move.to] = 0;
  } else {
    state.blackPositions[move.from] = 0;
    state.blackPositions[move.to] = (_c = move.promotion) != null ? _c : move.piece;
    state.whitePositions[move.to] = 0;
  }
  if (move.piece === WHITE_KING) {
    state.kingPosition[0] = move.to;
  } else if (move.piece === BLACK_KING) {
    state.kingPosition[1] = move.to;
  }
};
const applyEnPassant = (state, move) => {
  if (move.piece === WHITE_PAWN && isSquareOnRank(move.from, 1) && move.to - move.from === 16) {
    state.enPassant = move.from + 8;
  } else if (move.piece === BLACK_PAWN && isSquareOnRank(move.from, 6) && move.from - move.to === 16) {
    state.enPassant = move.from - 8;
  } else
    state.enPassant = null;
};
const applyMoveCount = (state) => {
  if (state.sideToMove === "b") {
    state.moveCount += 1;
  }
};
const applyHalfMoveCount = (state, move) => {
  if (!!state.board[move.to] || move.to === state.enPassant && (move.piece === WHITE_PAWN || move.piece === BLACK_PAWN)) {
    state.halfMoveCount = 0;
  } else {
    state.halfMoveCount += 1;
  }
};
const updateCastling = (state, move) => {
  const removeCastling = (castlingOptions) => {
    var _a, _b, _c;
    state.castling = (_c = (_b = (_a = state.castling) == null ? void 0 : _a.split("")) == null ? void 0 : _b.filter((i) => !castlingOptions.includes(i))) == null ? void 0 : _c.join("");
  };
  if (move.piece === WHITE_KING)
    removeCastling(["K", "Q"]);
  else if (move.piece === BLACK_KING)
    removeCastling(["k", "q"]);
  else if (move.piece === WHITE_ROOK) {
    if (move.from === 0)
      removeCastling(["Q"]);
    if (move.from === 7)
      removeCastling(["K"]);
  } else if (move.piece === BLACK_ROOK) {
    if (move.from === 56)
      removeCastling(["q"]);
    if (move.from === 63)
      removeCastling(["k"]);
  }
  if (state.board[move.to] === WHITE_ROOK) {
    if (move.to === 0)
      removeCastling(["Q"]);
    if (move.to === 7)
      removeCastling(["K"]);
  }
  if (state.board[move.to] === BLACK_ROOK) {
    if (move.to === 56)
      removeCastling(["q"]);
    if (move.to === 63)
      removeCastling(["k"]);
  }
};
const boardPositionNotationMoveToMove = (possibleMoves2, moveObject) => {
  const from = boardPositionNotationToSquare(moveObject.from);
  const to = boardPositionNotationToSquare(moveObject.to);
  const promotion = moveObject.promotion ? pieceLettersToValueMap[moveObject.promotion] : null;
  if (!isValidSquare(from) || !isValidSquare(to)) {
    throw new MoveError("invalid move");
  }
  const move = possibleMoves2.find((m) => m.from === from && m.to === to && m.promotion === promotion);
  if (!move)
    throw new MoveError("invalid move");
  return move;
};
const getSlidingMoves = (state, from, directions, steps) => {
  var _a;
  const isWhiteToMove = state.sideToMove === "w";
  const canTake = (piece2) => {
    return isWhiteToMove ? piece2 < 0 : piece2 > 0;
  };
  const piece = state.board[from];
  const moves = [];
  for (const direction of directions) {
    for (let step = 0; step < ((_a = steps[direction]) != null ? _a : 0); step++) {
      let position = 0;
      if (direction === Direction.TOP) {
        position = from + (step + 1) * 8;
      } else if (direction === Direction.RIGHT) {
        position = from + (step + 1) * 1;
      } else if (direction === Direction.BOTTOM) {
        position = from - (step + 1) * 8;
      } else if (direction === Direction.LEFT) {
        position = from - (step + 1) * 1;
      } else if (direction === Direction.TOP_LEFT) {
        position = from + (step + 1) * 7;
      } else if (direction === Direction.TOP_RIGHT) {
        position = from + (step + 1) * 9;
      } else if (direction === Direction.BOTTOM_RIGHT) {
        position = from - (step + 1) * 7;
      } else if (direction === Direction.BOTTOM_LEFT) {
        position = from - (step + 1) * 9;
      }
      if (isValidSquare(position)) {
        const pieceOnPosition = state.board[position];
        if (pieceOnPosition) {
          if (canTake(pieceOnPosition)) {
            moves.push({
              piece,
              from,
              to: position,
              promotion: null,
              castling: null
            });
          }
          break;
        } else {
          moves.push({
            piece,
            from,
            to: position,
            promotion: null,
            castling: null
          });
        }
      } else
        break;
    }
  }
  return moves;
};
const getSlidingAttacks = (state, from, directions, steps, attackedSquare) => {
  var _a;
  const piece = state.board[from];
  const moves = [];
  for (const direction of directions) {
    for (let step = 0; step < ((_a = steps[direction]) != null ? _a : 0); step++) {
      let position = 0;
      if (direction === Direction.TOP) {
        position = from + (step + 1) * 8;
      } else if (direction === Direction.RIGHT) {
        position = from + (step + 1) * 1;
      } else if (direction === Direction.BOTTOM) {
        position = from - (step + 1) * 8;
      } else if (direction === Direction.LEFT) {
        position = from - (step + 1) * 1;
      } else if (direction === Direction.TOP_LEFT) {
        position = from + (step + 1) * 7;
      } else if (direction === Direction.TOP_RIGHT) {
        position = from + (step + 1) * 9;
      } else if (direction === Direction.BOTTOM_RIGHT) {
        position = from - (step + 1) * 7;
      } else if (direction === Direction.BOTTOM_LEFT) {
        position = from - (step + 1) * 9;
      }
      if (isValidSquare(position)) {
        if (typeof attackedSquare === "number") {
          if (attackedSquare === position) {
            moves.push({
              piece,
              from,
              to: position,
              promotion: null,
              castling: null
            });
          }
        } else {
          moves.push({
            piece,
            from,
            to: position,
            promotion: null,
            castling: null
          });
        }
        if (state.board[position])
          break;
      } else
        break;
    }
  }
  return moves;
};
const BishopDirections = [
  Direction.TOP_LEFT,
  Direction.TOP_RIGHT,
  Direction.BOTTOM_LEFT,
  Direction.BOTTOM_RIGHT
];
const getBishopPossibleMoves = (state, from) => {
  const fileIndex = from % 8;
  const steps = {
    [Direction.TOP_RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM_RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM_LEFT]: fileIndex,
    [Direction.TOP_LEFT]: fileIndex
  };
  return getSlidingMoves(state, from, BishopDirections, steps);
};
const getBishopPossibleAttacks = (state, from, attackedSquare) => {
  const fileIndex = from % 8;
  const steps = {
    [Direction.TOP_RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM_RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM_LEFT]: fileIndex,
    [Direction.TOP_LEFT]: fileIndex
  };
  return getSlidingAttacks(state, from, BishopDirections, steps, attackedSquare);
};
const RookDirections = [
  Direction.TOP,
  Direction.BOTTOM,
  Direction.RIGHT,
  Direction.LEFT
];
const getRookPossibleMoves = (state, from) => {
  const fileIndex = from % 8;
  const rankIndex = Math.floor(from / 8);
  const steps = {
    [Direction.TOP]: 7 - rankIndex,
    [Direction.RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM]: rankIndex,
    [Direction.LEFT]: fileIndex
  };
  return getSlidingMoves(state, from, RookDirections, steps);
};
const getRookPossibleAttacks = (state, from, attackedSquare) => {
  const fileIndex = from % 8;
  const rankIndex = Math.floor(from / 8);
  const steps = {
    [Direction.TOP]: 7 - rankIndex,
    [Direction.RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM]: rankIndex,
    [Direction.LEFT]: fileIndex
  };
  return getSlidingAttacks(state, from, RookDirections, steps, attackedSquare);
};
const QueenDirections = [...RookDirections, ...BishopDirections];
const getQueenPossibleMoves = (state, from) => {
  const fileIndex = from % 8;
  const rankIndex = Math.floor(from / 8);
  const steps = {
    [Direction.TOP]: 7 - rankIndex,
    [Direction.RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM]: rankIndex,
    [Direction.LEFT]: fileIndex,
    [Direction.TOP_RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM_RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM_LEFT]: fileIndex,
    [Direction.TOP_LEFT]: fileIndex
  };
  return getSlidingMoves(state, from, QueenDirections, steps);
};
const getQueenPossibleAttacks = (state, from, attackedSquare) => {
  const fileIndex = from % 8;
  const rankIndex = Math.floor(from / 8);
  const steps = {
    [Direction.TOP]: 7 - rankIndex,
    [Direction.RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM]: rankIndex,
    [Direction.LEFT]: fileIndex,
    [Direction.TOP_RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM_RIGHT]: 7 - fileIndex,
    [Direction.BOTTOM_LEFT]: fileIndex,
    [Direction.TOP_LEFT]: fileIndex
  };
  return getSlidingAttacks(state, from, QueenDirections, steps, attackedSquare);
};
const KingDirections = [...QueenDirections];
const getKingPossibleMoves = (state, from) => {
  const fileIndex = from % 8;
  const rankIndex = Math.floor(from / 8);
  const steps = {
    [Direction.TOP]: rankIndex === 7 ? 0 : 1,
    [Direction.RIGHT]: fileIndex === 7 ? 0 : 1,
    [Direction.BOTTOM]: rankIndex === 0 ? 0 : 1,
    [Direction.LEFT]: fileIndex === 0 ? 0 : 1,
    [Direction.TOP_RIGHT]: fileIndex === 7 || rankIndex === 7 ? 0 : 1,
    [Direction.BOTTOM_RIGHT]: fileIndex === 7 || rankIndex === 0 ? 0 : 1,
    [Direction.BOTTOM_LEFT]: fileIndex === 0 || rankIndex === 0 ? 0 : 1,
    [Direction.TOP_LEFT]: fileIndex === 0 || rankIndex === 7 ? 0 : 1
  };
  const castles = [];
  if (state.sideToMove === "w") {
    if (canWhiteKingCastle(state)) {
      castles.push({
        piece: WHITE_KING,
        from,
        to: from + 2,
        promotion: null,
        castling: "K"
      });
    }
    if (canWhiteQueenCastle(state)) {
      castles.push({
        piece: WHITE_KING,
        from,
        to: from - 2,
        promotion: null,
        castling: "Q"
      });
    }
  } else {
    if (canBlackKingCastle(state)) {
      castles.push({
        piece: BLACK_KING,
        from,
        to: from + 2,
        promotion: null,
        castling: "K"
      });
    }
    if (canBlackQueenCastle(state)) {
      castles.push({
        piece: BLACK_KING,
        from,
        to: from - 2,
        promotion: null,
        castling: "Q"
      });
    }
  }
  return getSlidingMoves(state, from, KingDirections, steps).concat(castles);
};
const getKingPossibleAttacks = (state, from, attackedSquare) => {
  const fileIndex = from % 8;
  const rankIndex = Math.floor(from / 8);
  const steps = {
    [Direction.TOP]: rankIndex === 7 ? 0 : 1,
    [Direction.RIGHT]: fileIndex === 7 ? 0 : 1,
    [Direction.BOTTOM]: rankIndex === 0 ? 0 : 1,
    [Direction.LEFT]: fileIndex === 0 ? 0 : 1,
    [Direction.TOP_RIGHT]: fileIndex === 7 || rankIndex === 7 ? 0 : 1,
    [Direction.BOTTOM_RIGHT]: fileIndex === 7 || rankIndex === 0 ? 0 : 1,
    [Direction.BOTTOM_LEFT]: fileIndex === 0 || rankIndex === 0 ? 0 : 1,
    [Direction.TOP_LEFT]: fileIndex === 0 || rankIndex === 7 ? 0 : 1
  };
  return getSlidingAttacks(state, from, KingDirections, steps, attackedSquare);
};
const canCastleThroughPath = (state, path, castlingSquares) => {
  const isPathOccupied = path.some((square) => !!state.board[square]);
  if (isPathOccupied)
    return false;
  const isPathAttacked = castlingSquares.some((square) => isColorAttackingSquare(oppositeColor(state.sideToMove), state, square));
  if (isPathAttacked)
    return false;
  return true;
};
const canBlackQueenCastle = (state) => {
  var _a;
  if (!((_a = state.castling) == null ? void 0 : _a.includes("q")))
    return false;
  return canCastleThroughPath(state, [57, 58, 59], [58, 59, 60]);
};
const canBlackKingCastle = (state) => {
  var _a;
  if (!((_a = state.castling) == null ? void 0 : _a.includes("k")))
    return false;
  return canCastleThroughPath(state, [61, 62], [60, 61, 62]);
};
const canWhiteQueenCastle = (state) => {
  var _a;
  if (!((_a = state.castling) == null ? void 0 : _a.includes("Q")))
    return false;
  return canCastleThroughPath(state, [1, 2, 3], [2, 3, 4]);
};
const canWhiteKingCastle = (state) => {
  var _a;
  if (!((_a = state.castling) == null ? void 0 : _a.includes("K")))
    return false;
  return canCastleThroughPath(state, [5, 6], [4, 5, 6]);
};
const getKnightPossibleMoves = (state, from) => {
  const isWhiteToMove = state.sideToMove === "w";
  const canMoveOrTake = (position) => {
    return isWhiteToMove ? state.board[position] <= 0 : state.board[position] >= 0;
  };
  const piece = isWhiteToMove ? WHITE_KNIGHT : BLACK_KNIGHT;
  const moves = [];
  const fileRank = from % 8;
  if (fileRank < 7) {
    const oneOClock = from + 17;
    const fiveOClock = from - 15;
    if (canMoveOrTake(oneOClock)) {
      moves.push({
        piece,
        from,
        to: oneOClock,
        castling: null,
        promotion: null
      });
    }
    if (canMoveOrTake(fiveOClock)) {
      moves.push({
        piece,
        from,
        to: fiveOClock,
        castling: null,
        promotion: null
      });
    }
  }
  if (fileRank < 6) {
    const twoOClock = from + 10;
    const fourOClock = from - 6;
    if (canMoveOrTake(twoOClock)) {
      moves.push({
        piece,
        from,
        to: twoOClock,
        castling: null,
        promotion: null
      });
    }
    if (canMoveOrTake(fourOClock)) {
      moves.push({
        piece,
        from,
        to: fourOClock,
        castling: null,
        promotion: null
      });
    }
  }
  if (fileRank > 0) {
    const sevenOClock = from - 17;
    const elevenOClock = from + 15;
    if (canMoveOrTake(sevenOClock)) {
      moves.push({
        piece,
        from,
        to: sevenOClock,
        castling: null,
        promotion: null
      });
    }
    if (canMoveOrTake(elevenOClock)) {
      moves.push({
        piece,
        from,
        to: elevenOClock,
        castling: null,
        promotion: null
      });
    }
  }
  if (fileRank > 1) {
    const eightOClock = from - 10;
    const tenOClock = from + 6;
    if (canMoveOrTake(eightOClock)) {
      moves.push({
        piece,
        from,
        to: eightOClock,
        castling: null,
        promotion: null
      });
    }
    if (canMoveOrTake(tenOClock)) {
      moves.push({
        piece,
        from,
        to: tenOClock,
        castling: null,
        promotion: null
      });
    }
  }
  return moves;
};
const getKnightPossibleAttacks = (state, from, attackedSquare) => {
  const isWhiteToMove = state.sideToMove === "w";
  const moves = [];
  const piece = isWhiteToMove ? WHITE_KNIGHT : BLACK_KNIGHT;
  const fileRank = from % 8;
  if (fileRank < 7) {
    const oneOClock = from + 17;
    const fiveOClock = from - 15;
    if (isValidSquare(oneOClock)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === oneOClock) {
          moves.push({
            piece,
            from,
            to: oneOClock,
            promotion: null,
            castling: null
          });
        }
      } else {
        moves.push({
          piece,
          from,
          to: oneOClock,
          promotion: null,
          castling: null
        });
      }
    }
    if (isValidSquare(fiveOClock)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === fiveOClock) {
          moves.push({
            piece,
            from,
            to: fiveOClock,
            promotion: null,
            castling: null
          });
        }
      } else {
        moves.push({
          piece,
          from,
          to: fiveOClock,
          promotion: null,
          castling: null
        });
      }
    }
  }
  if (fileRank < 6) {
    const twoOClock = from + 10;
    const fourOClock = from - 6;
    if (isValidSquare(twoOClock)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === twoOClock) {
          moves.push({
            piece,
            from,
            to: twoOClock,
            promotion: null,
            castling: null
          });
        }
      } else {
        moves.push({
          piece,
          from,
          to: twoOClock,
          promotion: null,
          castling: null
        });
      }
    }
    if (isValidSquare(fourOClock)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === fourOClock) {
          moves.push({
            piece,
            from,
            to: fourOClock,
            promotion: null,
            castling: null
          });
        }
      } else {
        moves.push({
          piece,
          from,
          to: fourOClock,
          promotion: null,
          castling: null
        });
      }
    }
  }
  if (fileRank > 0) {
    const sevenOClock = from - 17;
    const elevenOClock = from + 15;
    if (isValidSquare(sevenOClock)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === sevenOClock) {
          moves.push({
            piece,
            from,
            to: sevenOClock,
            promotion: null,
            castling: null
          });
        }
      } else {
        moves.push({
          piece,
          from,
          to: sevenOClock,
          promotion: null,
          castling: null
        });
      }
    }
    if (isValidSquare(elevenOClock)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === elevenOClock) {
          moves.push({
            piece,
            from,
            to: elevenOClock,
            promotion: null,
            castling: null
          });
        }
      } else {
        moves.push({
          piece,
          from,
          to: elevenOClock,
          promotion: null,
          castling: null
        });
      }
    }
  }
  if (fileRank > 1) {
    const eightOClock = from - 10;
    const tenOClock = from + 6;
    if (isValidSquare(eightOClock)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === eightOClock) {
          moves.push({
            piece,
            from,
            to: eightOClock,
            promotion: null,
            castling: null
          });
        }
      } else {
        moves.push({
          piece,
          from,
          to: eightOClock,
          promotion: null,
          castling: null
        });
      }
    }
    if (isValidSquare(tenOClock)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === tenOClock) {
          moves.push({
            piece,
            from,
            to: tenOClock,
            promotion: null,
            castling: null
          });
        }
      } else {
        moves.push({
          piece,
          from,
          to: tenOClock,
          promotion: null,
          castling: null
        });
      }
    }
  }
  return moves;
};
const getPawnMovesForBlack = (state, from) => {
  const moves = [];
  const oneStepMove = from - 8;
  const twoStepMove = from - 16;
  const isOnInitialRank = isSquareOnRank(from, 6);
  if (isValidSquare(oneStepMove) && !state.board[oneStepMove]) {
    if (isSquareOnRank(oneStepMove, 0)) {
      [BLACK_QUEEN, BLACK_KNIGHT, BLACK_ROOK, BLACK_BISHOP].forEach((piece) => {
        moves.push({
          piece: BLACK_PAWN,
          from,
          to: oneStepMove,
          castling: null,
          promotion: piece
        });
      });
    } else {
      moves.push({
        piece: BLACK_PAWN,
        from,
        to: oneStepMove,
        castling: null,
        promotion: null
      });
    }
  }
  if (isValidSquare(twoStepMove) && isOnInitialRank && !state.board[oneStepMove] && !state.board[twoStepMove]) {
    moves.push({
      piece: BLACK_PAWN,
      from,
      to: twoStepMove,
      castling: null,
      promotion: null
    });
  }
  if (!isSquareOnFile(from, 0)) {
    const rightAttackMove = from - 9;
    const pieceOnPosition = state.board[rightAttackMove];
    if (isValidSquare(rightAttackMove) && (pieceOnPosition > 0 || rightAttackMove === state.enPassant)) {
      if (isSquareOnRank(rightAttackMove, 0)) {
        [BLACK_QUEEN, BLACK_KNIGHT, BLACK_ROOK, BLACK_BISHOP].forEach((piece) => {
          moves.push({
            piece: BLACK_PAWN,
            from,
            to: rightAttackMove,
            castling: null,
            promotion: piece
          });
        });
      } else {
        moves.push({
          piece: BLACK_PAWN,
          from,
          to: rightAttackMove,
          castling: null,
          promotion: null
        });
      }
    }
  }
  if (!isSquareOnFile(from, 7)) {
    const leftAttackMove = from - 7;
    const pieceOnPosition = state.board[leftAttackMove];
    if (isValidSquare(leftAttackMove) && (pieceOnPosition > 0 || leftAttackMove === state.enPassant)) {
      if (isSquareOnRank(leftAttackMove, 0)) {
        [BLACK_QUEEN, BLACK_KNIGHT, BLACK_ROOK, BLACK_BISHOP].forEach((piece) => {
          moves.push({
            piece: BLACK_PAWN,
            from,
            to: leftAttackMove,
            castling: null,
            promotion: piece
          });
        });
      } else {
        moves.push({
          piece: BLACK_PAWN,
          from,
          to: leftAttackMove,
          castling: null,
          promotion: null
        });
      }
    }
  }
  return moves;
};
const getPawnMovesForWhite = (state, from) => {
  const moves = [];
  const oneStepMove = from + 8;
  const twoStepMove = from + 16;
  const isOnInitialRank = isSquareOnRank(from, 1);
  if (isValidSquare(oneStepMove) && !state.board[oneStepMove]) {
    if (isSquareOnRank(oneStepMove, 7)) {
      [WHITE_QUEEN, WHITE_KNIGHT, WHITE_ROOK, WHITE_BISHOP].forEach((piece) => {
        moves.push({
          piece: WHITE_PAWN,
          from,
          to: oneStepMove,
          castling: null,
          promotion: piece
        });
      });
    } else {
      moves.push({
        piece: WHITE_PAWN,
        from,
        to: oneStepMove,
        castling: null,
        promotion: null
      });
    }
  }
  if (isValidSquare(twoStepMove) && isOnInitialRank && !state.board[oneStepMove] && !state.board[twoStepMove]) {
    moves.push({
      piece: WHITE_PAWN,
      from,
      to: twoStepMove,
      castling: null,
      promotion: null
    });
  }
  if (!isSquareOnFile(from, 0)) {
    const leftAttackMove = from + 7;
    const pieceOnPosition = state.board[leftAttackMove];
    if (isValidSquare(leftAttackMove) && (pieceOnPosition < 0 || leftAttackMove === state.enPassant)) {
      if (isSquareOnRank(leftAttackMove, 7)) {
        [WHITE_QUEEN, WHITE_KNIGHT, WHITE_ROOK, WHITE_BISHOP].forEach((piece) => {
          moves.push({
            piece: WHITE_PAWN,
            from,
            to: leftAttackMove,
            castling: null,
            promotion: piece
          });
        });
      } else {
        moves.push({
          piece: WHITE_PAWN,
          from,
          to: leftAttackMove,
          castling: null,
          promotion: null
        });
      }
    }
  }
  if (!isSquareOnFile(from, 7)) {
    const rightAttackMove = from + 9;
    const pieceOnPosition = state.board[rightAttackMove];
    if (isValidSquare(rightAttackMove) && (pieceOnPosition < 0 || rightAttackMove === state.enPassant)) {
      if (isSquareOnRank(rightAttackMove, 7)) {
        [WHITE_QUEEN, WHITE_KNIGHT, WHITE_ROOK, WHITE_BISHOP].forEach((piece) => {
          moves.push({
            piece: WHITE_PAWN,
            from,
            to: rightAttackMove,
            castling: null,
            promotion: piece
          });
        });
      } else {
        moves.push({
          piece: WHITE_PAWN,
          from,
          to: rightAttackMove,
          castling: null,
          promotion: null
        });
      }
    }
  }
  return moves;
};
const getPawnAttacksForBlack = (state, from, attackedSquare) => {
  const moves = [];
  if (!isSquareOnFile(from, 0)) {
    const rightAttackMove = from - 9;
    if (isValidSquare(rightAttackMove)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === rightAttackMove) {
          moves.push({
            piece: BLACK_PAWN,
            from,
            to: rightAttackMove,
            castling: null,
            promotion: null
          });
        }
      } else {
        moves.push({
          piece: BLACK_PAWN,
          from,
          to: rightAttackMove,
          castling: null,
          promotion: null
        });
      }
    }
  }
  if (!isSquareOnFile(from, 7)) {
    const leftAttackMove = from - 7;
    if (isValidSquare(leftAttackMove)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === leftAttackMove) {
          moves.push({
            piece: BLACK_PAWN,
            from,
            to: leftAttackMove,
            castling: null,
            promotion: null
          });
        }
      } else {
        moves.push({
          piece: BLACK_PAWN,
          from,
          to: leftAttackMove,
          castling: null,
          promotion: null
        });
      }
    }
  }
  return moves;
};
const getPawnAttacksForWhite = (state, from, attackedSquare) => {
  const moves = [];
  if (!isSquareOnFile(from, 0)) {
    const leftAttackMove = from + 7;
    if (isValidSquare(leftAttackMove)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === leftAttackMove) {
          moves.push({
            piece: WHITE_PAWN,
            from,
            to: leftAttackMove,
            castling: null,
            promotion: null
          });
        }
      } else {
        moves.push({
          piece: WHITE_PAWN,
          from,
          to: leftAttackMove,
          castling: null,
          promotion: null
        });
      }
    }
  }
  if (!isSquareOnFile(from, 7)) {
    const rightAttackMove = from + 9;
    if (isValidSquare(rightAttackMove)) {
      if (typeof attackedSquare === "number") {
        if (attackedSquare === rightAttackMove) {
          moves.push({
            piece: WHITE_PAWN,
            from,
            to: rightAttackMove,
            castling: null,
            promotion: null
          });
        }
      } else {
        moves.push({
          piece: WHITE_PAWN,
          from,
          to: rightAttackMove,
          castling: null,
          promotion: null
        });
      }
    }
  }
  return moves;
};
const possibleMoves = (game) => {
  const state = game.state();
  const isWhiteToMove = state.sideToMove === "w";
  const positions = isWhiteToMove ? state.whitePositions : state.blackPositions;
  const moves = [];
  positions.forEach((piece, pos) => {
    if (piece !== 0) {
      if (piece === WHITE_PAWN) {
        moves.push(...getPawnMovesForWhite(state, pos));
      } else if (piece === BLACK_PAWN) {
        moves.push(...getPawnMovesForBlack(state, pos));
      } else if (piece === WHITE_KNIGHT || piece === BLACK_KNIGHT) {
        moves.push(...getKnightPossibleMoves(state, pos));
      } else if (piece === WHITE_BISHOP || piece === BLACK_BISHOP) {
        moves.push(...getBishopPossibleMoves(state, pos));
      } else if (piece === WHITE_ROOK || piece === BLACK_ROOK) {
        moves.push(...getRookPossibleMoves(state, pos));
      } else if (piece === WHITE_QUEEN || piece === BLACK_QUEEN) {
        moves.push(...getQueenPossibleMoves(state, pos));
      } else if (piece === WHITE_KING || piece === BLACK_KING) {
        moves.push(...getKingPossibleMoves(state, pos));
      }
    }
  });
  return moves.filter((m) => !isInCheckAfterMove(game, m));
};
const possibleMovesForSquare = (game, square) => {
  if (!isValidSquare(square))
    return [];
  const state = game.state();
  const isWhiteToMove = state.sideToMove === "w";
  const piece = state.board[square];
  if (!piece)
    return [];
  if (piece > 0 && !isWhiteToMove)
    return [];
  if (piece < 0 && isWhiteToMove)
    return [];
  const moves = [];
  if (piece === WHITE_PAWN) {
    moves.push(...getPawnMovesForWhite(state, square));
  } else if (piece === BLACK_PAWN) {
    moves.push(...getPawnMovesForBlack(state, square));
  } else if (piece === WHITE_KNIGHT || piece === BLACK_KNIGHT) {
    moves.push(...getKnightPossibleMoves(state, square));
  } else if (piece === WHITE_BISHOP || piece === BLACK_BISHOP) {
    moves.push(...getBishopPossibleMoves(state, square));
  } else if (piece === WHITE_ROOK || piece === BLACK_ROOK) {
    moves.push(...getRookPossibleMoves(state, square));
  } else if (piece === WHITE_QUEEN || piece === BLACK_QUEEN) {
    moves.push(...getQueenPossibleMoves(state, square));
  } else if (piece === WHITE_KING || piece === BLACK_KING) {
    moves.push(...getKingPossibleMoves(state, square));
  }
  return moves.filter((m) => !isInCheckAfterMove(game, m));
};
const isColorAttackingSquare = (color, state, square) => {
  const positions = color === "w" ? state.whitePositions : state.blackPositions;
  const isAttacked = positions.some((piece, pos) => {
    if (piece !== 0) {
      if (piece === WHITE_PAWN) {
        return !!getPawnAttacksForWhite(state, pos, square).length;
      } else if (piece === BLACK_PAWN) {
        return !!getPawnAttacksForBlack(state, pos, square).length;
      } else if (piece === WHITE_KNIGHT || piece === BLACK_KNIGHT) {
        return !!getKnightPossibleAttacks(state, pos, square).length;
      } else if (piece === WHITE_BISHOP || piece === BLACK_BISHOP) {
        return !!getBishopPossibleAttacks(state, pos, square).length;
      } else if (piece === WHITE_ROOK || piece === BLACK_ROOK) {
        return !!getRookPossibleAttacks(state, pos, square).length;
      } else if (piece === WHITE_QUEEN || piece === BLACK_QUEEN) {
        return !!getQueenPossibleAttacks(state, pos, square).length;
      } else if (piece === WHITE_KING || piece === BLACK_KING) {
        return !!getKingPossibleAttacks(state, pos, square).length;
      }
    }
    return false;
  });
  return isAttacked;
};
const isInCheckAfterMove = (game, move) => {
  const state = game.state();
  const isWhiteToMove = state.sideToMove === "w";
  game.move(move);
  const kingPosition = isWhiteToMove ? state.kingPosition[0] : state.kingPosition[1];
  const attacked = isColorAttackingSquare(isWhiteToMove ? "b" : "w", state, kingPosition);
  game.undo();
  return attacked;
};
const hasInsufficientPieces = (state) => {
  const {whitePositions, blackPositions} = state;
  const whitePieces = whitePositions.filter((p) => p > 0);
  const blackPieces = blackPositions.filter((p) => p < 0);
  const whiteHasKingOnly = whitePieces.length === 1;
  const blackHasKingOnly = blackPieces.length === 1;
  if (whiteHasKingOnly && blackHasKingOnly)
    return true;
  const whiteHas2Pieces = whitePieces.length === 2;
  const blackHas2Pieces = blackPieces.length === 2;
  if (!whiteHasKingOnly && !whiteHas2Pieces || !blackHasKingOnly && !blackHas2Pieces) {
    return false;
  }
  const whiteSecondPiece = whitePieces.find((p) => p !== WHITE_KING);
  const blackSecondPiece = blackPieces.find((p) => p !== BLACK_KING);
  if (whiteHasKingOnly) {
    if (blackSecondPiece === BLACK_BISHOP)
      return true;
    if (blackSecondPiece === BLACK_KNIGHT)
      return true;
    return false;
  }
  if (blackHasKingOnly) {
    if (whiteSecondPiece === WHITE_BISHOP)
      return true;
    if (whiteSecondPiece === WHITE_KNIGHT)
      return true;
    return false;
  }
  if (whiteSecondPiece === WHITE_BISHOP && blackSecondPiece === BLACK_BISHOP) {
    if (colorOfSquare(state.board.indexOf(whiteSecondPiece)) === colorOfSquare(state.board.indexOf(blackSecondPiece))) {
      return true;
    }
  }
  return false;
};
const weights = new Map([
  [WHITE_PAWN, 100],
  [WHITE_KNIGHT, 320],
  [WHITE_BISHOP, 330],
  [WHITE_ROOK, 500],
  [WHITE_QUEEN, 900],
  [WHITE_KING, 6e4],
  [BLACK_PAWN, 100],
  [BLACK_KNIGHT, 320],
  [BLACK_BISHOP, 330],
  [BLACK_ROOK, 500],
  [BLACK_QUEEN, 900],
  [BLACK_KING, 6e4]
]);
const WhitePawnPST = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  5,
  10,
  10,
  -20,
  -20,
  10,
  10,
  5,
  5,
  -5,
  -10,
  0,
  0,
  -10,
  -5,
  5,
  0,
  0,
  0,
  20,
  20,
  0,
  0,
  0,
  5,
  5,
  10,
  25,
  25,
  10,
  5,
  5,
  10,
  10,
  20,
  30,
  30,
  20,
  10,
  10,
  50,
  50,
  50,
  50,
  50,
  50,
  50,
  50,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
];
const BlackPawnPST = WhitePawnPST.slice().reverse();
const WhiteKnightPST = [
  -50,
  -40,
  -30,
  -30,
  -30,
  -30,
  -40,
  -50,
  -40,
  -20,
  0,
  5,
  5,
  0,
  -20,
  -40,
  -30,
  5,
  10,
  15,
  15,
  10,
  5,
  -30,
  -30,
  0,
  15,
  20,
  20,
  15,
  0,
  -30,
  -30,
  5,
  15,
  20,
  20,
  15,
  5,
  -30,
  -30,
  0,
  10,
  15,
  15,
  10,
  0,
  -30,
  -40,
  -20,
  0,
  0,
  0,
  0,
  -20,
  -40,
  -50,
  -40,
  -30,
  -30,
  -30,
  -30,
  -40,
  -50
];
const BlackKnightPST = WhiteKnightPST.slice().reverse();
const WhiteBishopPST = [
  -20,
  -10,
  -10,
  -10,
  -10,
  -10,
  -10,
  -20,
  -10,
  5,
  0,
  0,
  0,
  0,
  5,
  -10,
  -10,
  10,
  10,
  10,
  10,
  10,
  10,
  -10,
  -10,
  0,
  10,
  10,
  10,
  10,
  0,
  -10,
  -10,
  5,
  5,
  10,
  10,
  5,
  5,
  -10,
  -10,
  0,
  5,
  10,
  10,
  5,
  0,
  -10,
  -10,
  0,
  0,
  0,
  0,
  0,
  0,
  -10,
  -20,
  -10,
  -10,
  -10,
  -10,
  -10,
  -10,
  -20
];
const BlackBishopPST = WhiteBishopPST.slice().reverse();
const WhiteRookPST = [
  0,
  0,
  0,
  5,
  5,
  0,
  0,
  0,
  -5,
  0,
  0,
  0,
  0,
  0,
  0,
  -5,
  -5,
  0,
  0,
  0,
  0,
  0,
  0,
  -5,
  -5,
  0,
  0,
  0,
  0,
  0,
  0,
  -5,
  -5,
  0,
  0,
  0,
  0,
  0,
  0,
  -5,
  -5,
  0,
  0,
  0,
  0,
  0,
  0,
  -5,
  5,
  10,
  10,
  10,
  10,
  10,
  10,
  5,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
];
const BlackRookPST = WhiteRookPST.slice().reverse();
const WhiteQueenPST = [
  -20,
  -10,
  -10,
  -5,
  -5,
  -10,
  -10,
  -20,
  -10,
  0,
  0,
  0,
  0,
  5,
  0,
  -10,
  -10,
  0,
  5,
  5,
  5,
  5,
  5,
  -10,
  -5,
  0,
  5,
  5,
  5,
  5,
  0,
  0,
  -5,
  0,
  5,
  5,
  5,
  5,
  0,
  -5,
  -10,
  0,
  5,
  5,
  5,
  5,
  0,
  -10,
  -10,
  0,
  0,
  0,
  0,
  0,
  0,
  -10,
  -20,
  -10,
  -10,
  -5,
  -5,
  -10,
  -10,
  -20
];
const BlackQueenPST = WhiteQueenPST.slice().reverse();
const WhiteKingPST = [
  20,
  30,
  10,
  0,
  0,
  10,
  30,
  20,
  20,
  20,
  0,
  0,
  0,
  0,
  20,
  20,
  -10,
  -20,
  -20,
  -20,
  -20,
  -20,
  -20,
  -10,
  -20,
  -30,
  -30,
  -40,
  -40,
  -30,
  -30,
  -20,
  -30,
  -40,
  -40,
  -50,
  -50,
  -40,
  -40,
  -30,
  -30,
  -40,
  -40,
  -50,
  -50,
  -40,
  -40,
  -30,
  -30,
  -40,
  -40,
  -50,
  -50,
  -40,
  -40,
  -30,
  -30,
  -40,
  -40,
  -50,
  -50,
  -40,
  -40,
  -30
];
const BlackKingPST = WhiteKingPST.slice().reverse();
const whitePST = new Map([
  [WHITE_PAWN, WhitePawnPST],
  [WHITE_KNIGHT, WhiteKnightPST],
  [WHITE_BISHOP, WhiteBishopPST],
  [WHITE_ROOK, WhiteRookPST],
  [WHITE_QUEEN, WhiteQueenPST],
  [WHITE_KING, WhiteKingPST]
]);
const blackPST = new Map([
  [BLACK_PAWN, BlackPawnPST],
  [BLACK_KNIGHT, BlackKnightPST],
  [BLACK_BISHOP, BlackBishopPST],
  [BLACK_ROOK, BlackRookPST],
  [BLACK_QUEEN, BlackQueenPST],
  [BLACK_KING, BlackKingPST]
]);
const getBestMove = (game, depth = 1, isAISide = true, alpha = -Infinity, beta = Infinity, score = 0) => {
  if (depth < 1)
    return {move: null, score};
  const moves = possibleMoves(game);
  if (!moves.length) {
    if (game.isInCheck()) {
      return {move: null, score: isAISide ? -(10 ** 10) : 10 ** 10};
    }
    return {move: null, score};
  }
  let highestScore = -Infinity;
  let lowestScore = Infinity;
  let bestMove = null;
  const movesWithTheirScore = moves.map((move) => {
    return [move, getMoveScore(game, move, isAISide)];
  }).sort((a, b) => isAISide ? b[1] - a[1] : a[1] - b[1]);
  for (const [move, moveScore] of movesWithTheirScore) {
    game.move(move);
    const {score: childBestScore} = getBestMove(game, depth - 1, !isAISide, alpha, beta, moveScore + score);
    game.undo();
    if (isAISide) {
      if (childBestScore > highestScore) {
        highestScore = childBestScore;
        bestMove = move;
      }
      if (childBestScore > alpha)
        alpha = childBestScore;
    } else {
      if (childBestScore < lowestScore) {
        lowestScore = childBestScore;
        bestMove = move;
      }
      if (childBestScore < beta)
        beta = childBestScore;
    }
    if (alpha >= beta)
      break;
  }
  return {move: bestMove, score: isAISide ? highestScore : lowestScore};
};
const getMoveScore = (game, move, isAISide) => {
  const {from, to, piece, promotion} = move;
  let score = 0;
  const pieceOnTarget = game.state().board[to];
  if (pieceOnTarget !== 0) {
    const pst2 = game.sideToMove() === "w" ? blackPST : whitePST;
    const pieceOnTargetWeight = weights.get(pieceOnTarget);
    if (isAISide) {
      score += pieceOnTargetWeight + pst2.get(pieceOnTarget)[to];
    } else {
      score -= pieceOnTargetWeight + pst2.get(pieceOnTarget)[to];
    }
  }
  const pieceOrPromotion = promotion || piece;
  const pst = game.sideToMove() === "w" ? whitePST : blackPST;
  if (isAISide) {
    score += weights.get(pieceOrPromotion) + pst.get(pieceOrPromotion)[to];
    score -= weights.get(piece) + pst.get(piece)[from];
  } else {
    score -= weights.get(pieceOrPromotion) + pst.get(pieceOrPromotion)[to];
    score += weights.get(piece) + pst.get(piece)[from];
  }
  return score;
};
const emptyBoard = new Array(64).fill(0);
const getEmptyBoard = () => emptyBoard.slice();
const defaultBlackPositions = emptyBoard.slice().fill(-1, 48, 56).fill(-4, 56, 57).fill(-2, 57, 58).fill(-3, 58, 59).fill(-5, 59, 60).fill(-6, 60, 61).fill(-3, 61, 62).fill(-2, 62, 63).fill(-4, 63);
const defaultWhitePositions = emptyBoard.slice().fill(1, 8, 16).fill(4, 7, 8).fill(2, 6, 7).fill(3, 5, 6).fill(5, 3, 4).fill(6, 4, 5).fill(3, 2, 3).fill(2, 1, 2).fill(4, 0, 1);
const populateColorsPositions = (board) => {
  const blackPositions = getEmptyBoard();
  const whitePositions = getEmptyBoard();
  board.forEach((piece, position) => {
    if (isWhitePiece(piece))
      whitePositions[position] = piece;
    else if (isBlackPiece(piece))
      blackPositions[position] = piece;
  });
  return {
    whitePositions,
    blackPositions
  };
};
const fenToBoard = (fenPositionPart) => {
  const board = getEmptyBoard();
  const parts = fenPositionPart.split("/").reverse();
  if (parts.length !== 8)
    throw new FenParseError("invalid position part");
  if (!fenPositionPart.includes("K") || !fenPositionPart.includes("k")) {
    throw new FenParseError("invalid position part");
  }
  let alreadyHasAWhiteKing = false;
  let alreadyHasABlackKing = false;
  parts.forEach((row, index) => {
    let fileIndex = 0;
    let rankLength = 0;
    let wasLastCharANumber = false;
    for (let entry = 0; entry < row.length; entry++) {
      const numberRepresentation = Number(row[entry]);
      if (Number.isNaN(numberRepresentation)) {
        wasLastCharANumber = false;
        rankLength += 1;
        if (row[entry] === "k") {
          if (alreadyHasABlackKing) {
            throw new FenParseError("invalid position part");
          }
          alreadyHasABlackKing = true;
        }
        if (row[entry] === "K") {
          if (alreadyHasAWhiteKing) {
            throw new FenParseError("invalid position part");
          }
          alreadyHasAWhiteKing = true;
        }
        const piece = pieceLettersToValueMap[row[entry]];
        if (!piece)
          throw new FenParseError("invalid position part");
        board[fileIndex + index * 8] = piece;
        fileIndex += 1;
      } else {
        if (wasLastCharANumber) {
          throw new FenParseError("invalid position part");
        }
        wasLastCharANumber = true;
        rankLength += numberRepresentation;
        fileIndex += numberRepresentation;
      }
    }
    if (rankLength < 8)
      throw new FenParseError("invalid position part");
    if (fileIndex > 8)
      throw new FenParseError("invalid position part");
  });
  return board;
};
const boardToFen = (board) => {
  const ranks = [];
  for (let square = 0; square < 64; square += 8) {
    const rank = board.slice(square, square + 8);
    let rankInLetters = "";
    let emptyCount = 0;
    rank.forEach((file, fileIndex) => {
      if (file === EMPTY)
        emptyCount += 1;
      else {
        rankInLetters += `${emptyCount || ""}${pieceValueToLetterMap[board[square + fileIndex]]}`;
        emptyCount = 0;
      }
    });
    if (emptyCount)
      rankInLetters += emptyCount;
    ranks.push(rankInLetters);
  }
  return ranks.reverse().join("/");
};
const parseFen = (fen) => {
  if (typeof fen !== "string")
    throw new FenParseError("FEN must be a string");
  if (fen.split(" ").length !== 6)
    throw new FenParseError("missing FEN parts");
  const [positions, sideToMove, castling, enPassant, halfMoveCounter, currentMoveNumber] = fen.split(" ");
  const positionRegex = /^([pnbrqkPNBRQK1-8]{1,8}\/?){8}\w+$/;
  const noDoubleDigitsRegex = /\d+\d+/;
  if (!positionRegex.test(positions)) {
    throw new FenParseError("invalid position part");
  }
  if (noDoubleDigitsRegex.test(positions)) {
    throw new FenParseError("invalid position part");
  }
  const sideToMoveRegex = /^b|w$/;
  if (!sideToMoveRegex.test(sideToMove)) {
    throw new FenParseError("invalid side to move");
  }
  const castlingRegex = /^-|K|Q|k|q\w+$/;
  if (!castlingRegex.test(castling)) {
    throw new FenParseError("invalid castling");
  }
  const enPassantRegex = /^-|[a-h][3-6]$/;
  if (!enPassantRegex.test(enPassant)) {
    throw new FenParseError("invalid en passant");
  }
  const halfMoveCounterRegex = /^\d+$/;
  if (!halfMoveCounterRegex.test(halfMoveCounter)) {
    throw new FenParseError("invalid half move count");
  }
  const currentMoveNumberRegex = /^\d+$/;
  if (!currentMoveNumberRegex.test(currentMoveNumber)) {
    throw new FenParseError("invalid move count");
  }
  return [
    positions,
    sideToMove,
    castling,
    enPassant,
    halfMoveCounter,
    currentMoveNumber
  ];
};
const fenToState = (fen) => {
  const [positionsPart, sideToMovePart, castlingPart, enPassantPart, halfMoveCounterPart, currentMoveNumberPart] = parseFen(fen);
  const board = fenToBoard(positionsPart);
  const {blackPositions, whitePositions} = populateColorsPositions(board);
  const whiteKingPosition = board.findIndex((piece) => piece === WHITE_KING);
  const blackKingPosition = board.findIndex((piece) => piece === BLACK_KING);
  const castling = castlingPart === "-" ? null : castlingPart;
  const sideToMove = sideToMovePart;
  const enPassant = enPassantPart === "-" ? null : boardPositionNotationToSquare(enPassantPart);
  const halfMoveCount = Number(halfMoveCounterPart);
  const moveCount = Number(currentMoveNumberPart);
  return {
    board,
    blackPositions,
    whitePositions,
    kingPosition: [whiteKingPosition, blackKingPosition],
    castling,
    enPassant,
    halfMoveCount,
    moveCount,
    sideToMove
  };
};
const stateToFen = (state) => {
  const positions = boardToFen(state.board);
  const sideToMove = state.sideToMove;
  const castling = state.castling || "-";
  const enPassant = state.enPassant ? squareToBoardPositionNotation(state.enPassant) : "-";
  const halfMoveCount = state.halfMoveCount;
  const moveCount = state.moveCount;
  return `${positions} ${sideToMove} ${castling} ${enPassant} ${halfMoveCount} ${moveCount}`;
};
const copyState = (state) => ({
  board: state.board.slice(),
  sideToMove: state.sideToMove,
  whitePositions: state.whitePositions.slice(),
  blackPositions: state.blackPositions.slice(),
  halfMoveCount: state.halfMoveCount,
  moveCount: state.moveCount,
  kingPosition: [state.kingPosition[0], state.kingPosition[1]],
  enPassant: state.enPassant,
  castling: state.castling
});
var __classPrivateFieldSet = function(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = function(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Game_instances, _Game_state, _Game_history, _Game_save, _Game_move;
class Game {
  constructor(fen) {
    _Game_instances.add(this);
    _Game_state.set(this, void 0);
    _Game_history.set(this, []);
    __classPrivateFieldSet(this, _Game_state, fenToState(fen != null ? fen : defaultFen), "f");
  }
  load(fen) {
    __classPrivateFieldSet(this, _Game_state, fenToState(fen), "f");
  }
  isGameOver() {
    const moves = possibleMoves(this);
    if (!moves.length)
      return true;
    if (__classPrivateFieldGet(this, _Game_state, "f").halfMoveCount >= 50)
      return true;
    if (hasInsufficientPieces(__classPrivateFieldGet(this, _Game_state, "f")))
      return true;
    return false;
  }
  isInCheck() {
    const isWhiteToMove = __classPrivateFieldGet(this, _Game_state, "f").sideToMove === "w";
    const kingPosition = isWhiteToMove ? __classPrivateFieldGet(this, _Game_state, "f").kingPosition[0] : __classPrivateFieldGet(this, _Game_state, "f").kingPosition[1];
    const attacked = isColorAttackingSquare(isWhiteToMove ? "b" : "w", __classPrivateFieldGet(this, _Game_state, "f"), kingPosition);
    return attacked;
  }
  status() {
    const moves = possibleMoves(this);
    const fiftyRuleDraw = __classPrivateFieldGet(this, _Game_state, "f").halfMoveCount >= 50;
    const insufficientPieces = hasInsufficientPieces(__classPrivateFieldGet(this, _Game_state, "f"));
    const inCheck = this.isInCheck();
    if (moves.length && !fiftyRuleDraw && !insufficientPieces) {
      return "playing";
    }
    if (!moves.length) {
      const oppositeColor2 = __classPrivateFieldGet(this, _Game_state, "f").sideToMove === "w" ? "black" : "white";
      if (inCheck)
        return `${oppositeColor2} won by checkmate`;
      else
        return `draw by stalemate`;
    }
    if (fiftyRuleDraw)
      return `draw by fifty rule`;
    if (insufficientPieces)
      return `draw by insufficient pieces`;
  }
  sideToMove() {
    return __classPrivateFieldGet(this, _Game_state, "f").sideToMove;
  }
  state() {
    return __classPrivateFieldGet(this, _Game_state, "f");
  }
  fen() {
    return stateToFen(__classPrivateFieldGet(this, _Game_state, "f"));
  }
  pieceOnSquare(square) {
    let piece;
    if (typeof square === "string") {
      piece = __classPrivateFieldGet(this, _Game_state, "f").board[boardPositionNotationToSquare(square)];
    } else {
      piece = __classPrivateFieldGet(this, _Game_state, "f").board[square];
    }
    if (!piece)
      return null;
    return pieceValueToLetterMap[piece];
  }
  possibleMoves() {
    return possibleMoves(this).map((move) => ({
      from: squareToBoardPositionNotation(move.from),
      to: squareToBoardPositionNotation(move.to),
      promotion: move.promotion ? pieceValueToLetterMap[move.promotion] : null,
      piece: pieceValueToLetterMap[move.piece],
      castling: move.castling
    }));
  }
  bestMove(depth = 6) {
    const {move} = getBestMove(this, depth);
    if (!move)
      return null;
    return {
      from: squareToBoardPositionNotation(move.from),
      to: squareToBoardPositionNotation(move.to),
      promotion: move.promotion ? pieceValueToLetterMap[move.promotion] : null,
      piece: pieceValueToLetterMap[move.piece],
      castling: move.castling
    };
  }
  possibleMovesForPosition(position) {
    const square = boardPositionNotationToSquare(position);
    return possibleMovesForSquare(this, square).map((move) => ({
      from: squareToBoardPositionNotation(move.from),
      to: squareToBoardPositionNotation(move.to),
      promotion: move.promotion ? pieceValueToLetterMap[move.promotion] : null,
      piece: pieceValueToLetterMap[move.piece],
      castling: move.castling
    }));
  }
  move(move) {
    if (isBoardPositionNotationMove(move)) {
      const moves = possibleMoves(this);
      __classPrivateFieldGet(this, _Game_instances, "m", _Game_move).call(this, boardPositionNotationMoveToMove(moves, move));
    } else {
      __classPrivateFieldGet(this, _Game_instances, "m", _Game_move).call(this, move);
    }
  }
  undo() {
    const previous = __classPrivateFieldGet(this, _Game_history, "f").pop();
    if (previous) {
      __classPrivateFieldSet(this, _Game_state, previous, "f");
    }
  }
}
_Game_state = new WeakMap(), _Game_history = new WeakMap(), _Game_instances = new WeakSet(), _Game_save = function _Game_save2() {
  __classPrivateFieldGet(this, _Game_history, "f").push(copyState(__classPrivateFieldGet(this, _Game_state, "f")));
}, _Game_move = function _Game_move2(move) {
  __classPrivateFieldGet(this, _Game_instances, "m", _Game_save).call(this);
  applyHalfMoveCount(__classPrivateFieldGet(this, _Game_state, "f"), move);
  applyMoveCount(__classPrivateFieldGet(this, _Game_state, "f"));
  updateCastling(__classPrivateFieldGet(this, _Game_state, "f"), move);
  applyMove(__classPrivateFieldGet(this, _Game_state, "f"), move);
  applyEnPassant(__classPrivateFieldGet(this, _Game_state, "f"), move);
  __classPrivateFieldGet(this, _Game_state, "f").sideToMove = oppositeColor(__classPrivateFieldGet(this, _Game_state, "f").sideToMove);
};
export {Game, boardPositionNotationToSquare, printBoard, squareToBoardPositionNotation};
export default null;
