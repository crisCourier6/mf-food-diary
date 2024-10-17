import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { createTheme, ThemeProvider } from '@mui/material';
import '@fontsource/righteous/400.css';

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    dashed: true;
    dark:true;
    inverted:true
  }
}


const theme = createTheme({
  typography: {
    h4: {
      fontFamily: "Righteous",
      color: "#425a6c"
    },
    h5: {
      fontFamily: "Righteous",
      color: "#425a6c"
    },
    h6: {
      fontFamily: "Righteous",
      color: "#425a6c"
    }
  },
  palette: {
    primary: {
      light: '#e8eff9',
      main: "#425a6c",
      dark: '#22323f',
      contrastText: '#ffffff',
    },
    secondary: {
      light: '#eefded',
      main: "#9bf096",
      dark: '#008537',
      contrastText: '#22323f',
    },
  },
  components: {
    MuiSwitch: {
      defaultProps: {
        color:"warning"
      },
    },
    
    MuiButton: {
      variants: [
        {
          props: { variant: "dashed" },
          style: {
           
            borderRadius: 10,
            border: "5px dashed",
            borderColor: "#ffffff",
            backgroundColor: "#ffffff",
            "&:hover": {
              backgroundColor: "#ffffff",
              border: "5px dashed",
              borderColor: "#9bf096"
            }
          },
        },
      ],
      styleOverrides: {
        root: {
          fontWeight: "bold",
          textTransform: "none",
          "&:hover" : {
            color: "#22323f",
            backgroundColor: "#9bf096",
            borderColor: "#9bf096"
          }
        }
      }
    },
    
  }
})

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
      

