import Head from 'next/head';
import { Box, Button, Grid, Paper, TextField } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import { useForm } from 'react-hook-form';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function Transform() {
  const { register, handleSubmit } = useForm();
  const { data: session }: any = useSession();
  const [progressMessages, setProgressMessages] = useState([]);
  const [setupStatus, setSetupStatus] = useState("not-started");
  const [failureMessage, setFailureMessage] = useState(null);

  var checkProgress = async function (taskId: string) {
    await fetch(`${backendUrl}/api/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    }).then((response) => {
      if (response.ok) {
        response.json().then((message) => {

          setProgressMessages(message['progress']);

          var lastMessage = message['progress'][message['progress'].length - 1];

          if (lastMessage['status'] === 'completed') {
            setSetupStatus("completed");

          } else if (lastMessage['status'] === 'failed') {
            setSetupStatus("failed");
            setFailureMessage(lastMessage['message']);

          } else {
            setTimeout(() => { checkProgress(taskId) }, 1000);
          }
        });
      }
    });
  }

  const onSubmit = async (data: any) => {
    setSetupStatus("started");
    await fetch(`${backendUrl}/api/dbt/workspace/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify({
        gitrepoUrl: data.gitrepoUrl,
        dbtVersion: "1.4.5",
        profile: {
          name: 'dbt',
          target: 'dev',
          target_configs_schema: 'public',
        }
      }),
    }).then((response) => {
      if (response.ok) {
        response.json().then((message) => {
          setTimeout(() => { checkProgress(message.task_id) }, 1000);
        });
      } else {
        response.json().then((message) => {
          console.error(message);
        })
        setSetupStatus("failed");
      }
    });
  };

  return (
    <>
      <PageHead title="Development Data Platform" />
      <main className={styles.main}>
        <Typography variant="h1" gutterBottom color="primary.main">
          DDP platform transform page
        </Typography>
        <Box className={styles.Container}>
          <Grid container columns={5}>
            <Grid item xs={8}>
              <Paper elevation={3} sx={{ p: 4 }}>

                {
                  setupStatus === 'not-started' &&

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Box className={styles.Input} >
                      <TextField
                        id="outlined-basic"
                        label="GitHub repo URL"
                        variant="outlined"
                        {...register('gitrepoUrl', { required: true })}
                      />
                    </Box>
                    <Box className={styles.Input}>
                      <Button variant="contained" type="submit">
                        Save
                      </Button>
                    </Box>
                  </form>
                }
                {
                  setupStatus === 'started' &&
                  <>
                    <div>Setting up workspace...</div>
                    <div>{progressMessages.map(message => <div key={message.stepnum}>{message.message}</div>)}</div>
                  </>
                }
                {
                  setupStatus === 'completed' &&
                  <div>Setup complete</div>
                }
                {
                  setupStatus === 'failed' &&
                  <>
                    <div>Setup failed: {failureMessage}</div>
                  </>
                }
              </Paper>

            </Grid>
          </Grid>
        </Box>
      </main>
    </>
  );
}
