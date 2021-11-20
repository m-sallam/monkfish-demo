import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Game } from 'monkfish'
import { Chessboard, INPUT_EVENT_TYPE, MARKER_TYPE, COLOR} from 'https://cdn.skypack.dev/cm-chessboard'
import { Container, Button, Grid, GridItem, IconButton, Heading, useColorMode, Link, SliderTrack, Slider, Box, SliderFilledTrack, SliderThumb, Text } from "@chakra-ui/react"
import { ArrowBackIcon, AddIcon, MoonIcon, SunIcon } from '@chakra-ui/icons'

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

      return true;
    } catch (_) {
      console.warn("invalid move");
    }
  }
}


export default function Home() {
  const [gameState, setGame] = useState({ game: new Game() })
  const [board, setBoard] = useState(null)
  const boardRef = useRef(null)
  const { colorMode, toggleColorMode } = useColorMode()
  const { game } = gameState
  const workerRef = useRef(null)
  const [thinking, setThinking] = useState(false)
  const [depth, setDepth] = useState(5)

  useEffect(() => {
    if (game.sideToMove() === 'b' && !game.isGameOver()) {
      setThinking(true)
      workerRef.current = new Worker(
        new URL('../worker.js', import.meta.url)
      );
      workerRef.current.onmessage = (event) => {
        const { move } = event.data
        if (move) {
          const piece = game.pieceOnSquare(move.from);
          if ((piece === 'p' || piece === 'P') && (move.to.charAt(1) === '8' || move.to.charAt(1) === '1')) {
            move.promotion = 'q';
          }
          game.move(move);
          setGame({ game })
          board.enableMoveInput((e) => inputHandler(e, game, setGame), COLOR.white)
          board.setPosition(game.fen())
          setThinking(false)
        }
      }
      workerRef.current.postMessage({ fen: game.fen(), depth });

      return () => workerRef.current.terminate()
    }
  }, [gameState])

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
    if (workerRef.current) {
      workerRef.current.terminate()
    }
    setGame({ game: new Game() })
  }

  const undo = () => {
    if (workerRef.current) {
      workerRef.current.terminate()
    }
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

      <div style={{ position: 'absolute', right: '0', top: '10px' }}>
        <IconButton icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} variant='none' onClick={toggleColorMode} />
        <Button as={Link} href="https://github.com/m-sallam/monkfish" isExternal variant='none'>
          <Image className={colorMode === 'dark' ? 'image_dark' : ''} src='/github.png' alt='github' width='30px' height='30px' />
        </Button>
      </div>

      <Grid templateColumns="repeat(7, 1fr)" gap={4} my='10px'>
        <GridItem colSpan={2}>
          <Button onClick={newGame} leftIcon={<AddIcon />} colorScheme='orange' variant='ghost'> New Game </Button>
        </GridItem>
        <GridItem colSpan={4} display='flex' alignItems='center'>
          <Text whiteSpace='nowrap' mr='15px' fontSize="md">depth: {depth}</Text>
          <Slider defaultValue={depth} min={1} max={8} step={1} onChange={(value) => setDepth(value)}>
            <SliderTrack bg="orange.100">
              <Box position="relative" right={10} />
              <SliderFilledTrack bg="orange" />
            </SliderTrack>
            <SliderThumb boxSize={4} />
          </Slider>
        </GridItem>
        <GridItem colStart={7} colEnd={7} display='flex' justifyContent='flex-end'>
          <IconButton colorScheme="orange" icon={<ArrowBackIcon />} variant="outline" onClick={undo} />
        </GridItem>
      </Grid>

      <div ref={boardRef} style={{ width: 600 }} > </div>

      <Heading as="h2" size="xl" textAlign='center' mt='5px'>
        {game.status() === 'playing' ? '' : game.status()}
        {thinking ? <Thinking /> : ''}
      </Heading>
  </Container>
  )
}

export const Thinking = () => {
  const [length, setLength] = useState(0)
  const [thinking, setThinking] = useState('thinking')

  useEffect(() => {
    const interval = setTimeout(() => {
      if (length < 3) {
        setLength((p) => p + 1)
      } else {
        setLength(0)
      }
    }, 500)

    setThinking('thinking'.concat('.'.repeat(length)))

    return () => clearTimeout(interval)
  }, [length])

  return <>{thinking}</>
}
