import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Nawi | Copiloto comercial',description:'Prioriza y recupera oportunidades comerciales'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="es"><body>{children}</body></html>}
