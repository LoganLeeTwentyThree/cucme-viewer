use serde_json::{json, Value};
use std::{env, io::{BufRead, BufReader, Read, Write}, process::{ChildStdin, ChildStdout, Command, Stdio}, thread, time::Duration};
use format_bytes::format_bytes;

use regex::Regex;
mod dn;
use dn::*;
mod pool;
use pool::*;

#[tauri::command]
fn set_credentials(ip : String, user : String, password : String)
{
    env::set_var("ip", ip);
    env::set_var("user", user);
    env::set_var("password", password);
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn get_phones() -> String {
    
    let cmd = r"C:\Program Files\PuTTY\plink.exe"; 
    let mut child = Command::new(cmd)
    .args([
            "-ssh",
            "-l", &env::var("user").unwrap(),
            "-pw", &env::var("password").unwrap(),
            "-noagent",
            "-batch", // disables any interactive GUI
            &env::var("ip").unwrap(),
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("failed to start plink");

    let mut stdin = child.stdin.take().expect("no stdin");
    let stdout = child.stdout.take().expect("no stdout");


    // Disable pagination
    stdin.write_all(b"terminal length 0\r\n").unwrap();
    stdin.flush().unwrap();
    thread::sleep(Duration::from_millis(300));

    stdin.write_all(b"show config\r\n").unwrap();
    stdin.flush().unwrap();
    thread::sleep(Duration::from_secs(2));

    // Exit the session gracefully
    stdin.write_all(b"exit\r\n").unwrap();
    stdin.flush().unwrap();

    
    let mut reader = BufReader::new(stdout);
    let mut buf = String::new();
    let mut dns : Vec<DN> = Vec::new();

    loop{
        buf.clear();
        let num = reader.read_line(&mut buf).unwrap();
        if num == 0
        {
            break;
        }

        if buf.starts_with("voice register dn")
        {
            let mut byte_arr : Vec<u8> = Vec::new();
            reader.read_until(b'!', &mut byte_arr).unwrap();
            buf.push_str(&String::from_utf8_lossy(&byte_arr));

            let reg = Regex::new(r"(?ms)^\s*voice register dn\s+(\d+).*?^\s*number\s+(\d+)(?:.*?^\s*pickup-group\s+(\d+))?.*?^\s*name\s+([^\r\n]+).*?^\s*label\s+([^\r\n]+)").unwrap();
            if let Some(caps) = reg.captures(&buf) {
                dns.push(DN {
                    id: caps.get(1).unwrap().as_str().parse().unwrap(),
                    number: caps.get(2).unwrap().as_str().parse().unwrap(),
                    pickup_group: caps.get(3)
                        .and_then(|m| m.as_str().parse::<i8>().ok()),
                    name: caps.get(4).unwrap().as_str().into(),
                    label: caps.get(5).unwrap().as_str().into(),         
                });
            }else {
                break;
            }
            
        }

        
    } 

    Value::to_string(&json!(dns))
}

// fn get_pools() -> String {
//     let (mut stdin, stdout) = start_ssh_session();
    
//     // Disable pagination
//     stdin.write_all(b"terminal length 0\r\n").unwrap();
//     stdin.flush().unwrap();
//     thread::sleep(Duration::from_millis(300));

//     stdin.write_all(b"show config\r\n").unwrap();
//     stdin.flush().unwrap();
//     thread::sleep(Duration::from_secs(2));

//     // Exit the session gracefully
//     writeln!(stdin, "exit").unwrap();
//     stdin.flush().unwrap();

    
//     let mut reader = BufReader::new(stdout);
//     let mut buf = String::new();
//     let mut dns : Vec<DN> = Vec::new();

//     loop{
//         buf.clear();
//         let num = reader.read_line(&mut buf).unwrap();
//         if num == 0
//         {
//             break;
//         }

//         if buf.starts_with("voice register pool")
//         {
//             let mut byte_arr : Vec<u8> = Vec::new();
//             reader.read_until(b'!', &mut byte_arr).unwrap();
//             buf.push_str(&String::from_utf8_lossy(&byte_arr));

//             let reg = Regex::new(r"(?ms)^\s*voice register pool\s+(\d+).*?^\s*number\s+(\d+)(?:.*?^\s*pickup-group\s+(\d+))?.*?^\s*name\s+([^\r\n]+).*?^\s*label\s+([^\r\n]+)").unwrap();
//             if let Some(caps) = reg.captures(&buf) {
//                 dns.push(DN {
//                     id: caps.get(1).unwrap().as_str().parse().unwrap(),
//                     number: caps.get(2).unwrap().as_str().parse().unwrap(),
//                     pickup_group: caps.get(3)
//                         .and_then(|m| m.as_str().parse::<i8>().ok()),
//                     name: caps.get(4).unwrap().as_str().into(),
//                     label: caps.get(5).unwrap().as_str().into(),         
//                 });
//             }else {
//                 break;
//             }
            
//         }

        
//     } 

// }

#[tauri::command]
fn write_phone(dn : i8, name : String, label : String, number : i16, pickup : Option<i8>) -> String {
    let cmd = r"C:\Program Files\PuTTY\plink.exe"; 
    let mut child = Command::new(cmd)
    .args([
            "-ssh",
            "-l", &env::var("user").unwrap(),
            "-pw", &env::var("password").unwrap(),
            "-noagent",
            "-batch", // disables any interactive GUI
            &env::var("ip").unwrap(),
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("failed to start plink");

    let mut stdin = child.stdin.take().expect("no stdin");
    let stdout = child.stdout.take().expect("no stdout");


    // Disable pagination
    stdin.write_all(b"terminal length 0\r\n").unwrap();
    stdin.flush().unwrap();
    thread::sleep(Duration::from_millis(300));

    stdin.write_all(b"config terminal\r\n").unwrap();
    stdin.flush().unwrap();
    thread::sleep(Duration::from_secs(1));

    stdin.write_all(&format_bytes!(b"voice register dn {}\r\n", dn)[..]).unwrap();
    stdin.flush().unwrap();
    thread::sleep(Duration::from_secs(1));

    stdin.write_all(&format_bytes!(b"number {}\r\nlabel {}\r\nname {}\r\n", number, label.as_bytes(), name.as_bytes())[..]).unwrap();
    stdin.flush().unwrap();
    thread::sleep(Duration::from_secs(1));

    if let Some(group) = pickup {
        stdin.write_all(&format_bytes!(b"pickup-group {}\r\n", group)[..]).unwrap();
        stdin.flush().unwrap();
        thread::sleep(Duration::from_secs(1));
    }else {
        stdin.write_all(b"no pickup-group {}\r\n").unwrap();
        stdin.flush().unwrap();
        thread::sleep(Duration::from_secs(1));
    }

    stdin.write_all(b"voice register global\r\n").unwrap();
    stdin.flush().unwrap();
    thread::sleep(Duration::from_secs(1));

    stdin.write_all(b"create profile\r\n").unwrap();
    stdin.flush().unwrap();
    thread::sleep(Duration::from_secs(70));

    stdin.write_all(b"end\r\n").unwrap();
    stdin.flush().unwrap();
    thread::sleep(Duration::from_secs(1));

    stdin.write_all(b"wr mem\r\n").unwrap();
    stdin.flush().unwrap();
    thread::sleep(Duration::from_secs(2));

    // Exit the session gracefully
    writeln!(stdin, "exit\r\n").unwrap();
    stdin.flush().unwrap();

    let mut reader = BufReader::new(stdout);
    let mut bytes = Vec::new();
    reader.read_to_end(&mut bytes).unwrap();
    let buf = String::from_utf8_lossy(&bytes).to_string();
    return buf
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_phones, write_phone, set_credentials])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
