use std::process::{Command, Stdio, ChildStdin, ChildStdout};
use std::io::{self, Write};
use std::time::Duration;
use std::{env, thread};

pub struct SshSession {
    pub stdin: ChildStdin,
    pub stdout: ChildStdout,
}

impl SshSession{
    pub fn send(&mut self, bytes : &[u8])
    {
        self.stdin.write_all(bytes).unwrap();
        self.stdin.flush().unwrap();
    }

    pub fn end(&mut self)
    {
        self.send(b"end\r\n");
        self.send(b"exit\r\n");
    }

    pub fn end_and_save(&mut self)
    {
        self.send(b"end\r\n");
        self.send(b"wr mem\r\n");
        thread::sleep(Duration::from_secs(2));
        self.send(b"exit\r\n");
    }
}

pub fn start_ssh_session() -> io::Result<SshSession> {
    let cmd = r"C:\Program Files\PuTTY\plink.exe";

    let mut child = Command::new(cmd)
        .args([
            "-ssh",
            "-l", &env::var("user").unwrap(),
            "-pw", &env::var("password").unwrap(),
            "-noagent",
            "-batch",
            &env::var("ip").unwrap(),
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()?;

    let stdin = child.stdin.take().ok_or_else(|| io::Error::new(io::ErrorKind::Other, "no stdin"))?;
    let stdout = child.stdout.take().ok_or_else(|| io::Error::new(io::ErrorKind::Other, "no stdout"))?;

    Ok(SshSession { stdin, stdout })
}
