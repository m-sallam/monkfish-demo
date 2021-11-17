import '../styles/globals.css'
import '../styles/chessboard.css'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'

const theme = extendTheme({
  // config: {
  //   initialColorMode: "light",
  // },
  styles: {
    global: {
      body: {
        bg: mode("#fdfaf5", 'red')
      },
    },
  },
})

const overrides = extendTheme({
  styles: {
    global: (props) => ({
      body: {
        bg: mode("#fdfaf5", "#2a2a2b")(props),
      },
    }),
  },
})

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={overrides}>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}

export default MyApp
