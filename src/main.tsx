import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Index from './Index'
import { createGlobalStyle } from 'styled-components'; 

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0; 
    padding: 0; 
    overflow-x: hidden; 
  }
`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalStyle /> 
    <Index />
  </StrictMode>,
)