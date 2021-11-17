import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Game } from 'monkfish'
import { Chessboard, INPUT_EVENT_TYPE, MARKER_TYPE, COLOR} from 'https://cdn.skypack.dev/cm-chessboard'
import { Container, Button, Grid, GridItem, IconButton, Heading } from "@chakra-ui/react"
import { ArrowBackIcon, AddIcon } from '@chakra-ui/icons'

function inputHandler(event, game, setGame) {
  if (game.isGameOver()) return false;
  event.chessboard.removeMarkers(undefined, MARKER_TYPE.dot);
  event.chessboard.removeMarkers(undefined, MARKER_TYPE.square);

  if (event.type === INPUT_EVENT_TYPE.moveStart) {
    event.chessboard.addMarker(event.square, MARKER_TYPE.square);

    const moves = game.possibleMovesForPosition(event.square);
    for (const move of moves) {
      event.chessboard.addMarker(
        move.to,
        MARKER_TYPE.dot,
      );
    }

    return moves.length > 0;
  } else if (event.type === INPUT_EVENT_TYPE.moveDone) {
    try {
      const piece = game.pieceOnSquare(event.squareFrom);
      const move = { from: event.squareFrom, to: event.squareTo }
      if ((piece === 'p' || piece === 'P') && (event.squareTo.charAt(1) === '8' || event.squareTo.charAt(1) === '1')) {
        move.promotion = 'Q';
      }
      game.move(move);
      setGame({ game });

      event.chessboard.removeMarkers(undefined, MARKER_TYPE.square);
      event.chessboard.disableMoveInput();
      event.chessboard.setPosition(game.fen());

      const possibleMoves = game.possibleMoves();
      if (possibleMoves.length) {
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        const randomMove = possibleMoves[randomIndex];

        setTimeout(() => {
          const piece = game.pieceOnSquare(randomMove.from);
          if ((piece === 'p' || piece === 'P') && (randomMove.to.charAt(1) === '8' || randomMove.to.charAt(1) === '1')) {
            randomMove.promotion = 'Q';
          }
          game.move(randomMove);
          setGame({ game });
          event.chessboard.enableMoveInput((e) => inputHandler(e, game, setGame), COLOR.white);
          event.chessboard.setPosition(game.fen());
        }, 500);

        return true;
      }
    } catch (_) {
      console.warn("invalid move");
    }
  }
}


export default function Home() {
  const [{ game }, setGame] = useState({ game: new Game() })
  const [board, setBoard] = useState(null)
  const boardRef = useRef(null)


  useEffect(() => {
    const board = new Chessboard(boardRef.current, {
      position: game.fen(),
      style: {
        cssClass: "default",
        showCoordinates: true,
        aspectRatio: 1,
      },
      style: {
        moveFromMarker: undefined,
        moveToMarker: undefined,
      },
      sprite: {
        url: "./chessboard.svg",
        cache: true,
      },
    })

    board.enableMoveInput((event) => inputHandler(event, game, setGame), COLOR.white);
    setBoard(board)

    return () => board.destroy()
  }, [game]) // eslint-disable-line

  const newGame = () => {
    setGame({ game: new Game() })
  }

  const undo = () => {
    if (game.sideToMove() === "w") {
      game.undo()
      game.undo()
    } else {
      game.undo()
    }
    setGame({ game });
    board.setPosition(game.fen());
    board.enableMoveInput((event) => inputHandler(event, game, setGame), COLOR.white);
  }

  return (
    <Container p='0' pt='3rem' pr='5px'>
      <Head>
        <title>Monkfish Demo</title>
        <meta name="description" content="A demo for the monkfish chess engine" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ position: 'absolute', right: '10px', top: '10px' }}>
        <a href='https://github.com/m-sallam/monkfish' target='_blank' rel="noreferrer">
          <Image src='/github.png' alt='github' width='34px' height='34px' />
        </a>
      </div>

      <Grid templateColumns="repeat(7, 1fr)" gap={4} my='10px'>
        <GridItem colSpan={2}>
          <Button onClick={newGame} leftIcon={<AddIcon />} colorScheme='orange' variant='ghost'> New Game </Button>
        </GridItem>
        <GridItem colStart={7} colEnd={7} display='flex' justifyContent='flex-end'>
          <IconButton colorScheme="orange" icon={<ArrowBackIcon />} variant="outline" onClick={undo} />
        </GridItem>
      </Grid>

      <div ref={boardRef} style={{ width: 600 }} > </div>

      <Heading as="h2" size="xl" textAlign='center' mt='5px'>
        {game.status() === 'playing' ? '' : game.status()}
      </Heading>
  </Container>
  )
}
