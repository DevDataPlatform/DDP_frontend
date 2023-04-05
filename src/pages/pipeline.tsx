import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import { Button, Typography } from '@mui/material';

export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <Typography variant="h1" gutterBottom color="primary.main">
          DDP platform analysis page
        </Typography>
        <Button color="primary" variant="contained">
          DDP platform
        </Button>
      </main>
    </>
  );
}
