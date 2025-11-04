use serde_json::{json, Value};
use std::{env, io::{BufRead, BufReader, Read}, thread, time::Duration};
use format_bytes::format_bytes;

use regex::Regex;
mod dn;
use dn::*;
mod pool;
use pool::*;
mod ssh;
use ssh::*;

#[tauri::command]
fn set_credentials(ip : String, user : String, password : String)
{
    env::set_var("ip", ip);
    env::set_var("user", user);
    env::set_var("password", password);
}

#[tauri::command]
fn get_phones() -> String {
    
    let mut session = start_ssh_session().unwrap();

    // Disable pagination
    session.send(b"terminal length 0\r\n");
    thread::sleep(Duration::from_millis(300));

    session.send(b"show config\r\n");
    thread::sleep(Duration::from_secs(2));

    // Exit the session gracefully
    session.send(b"exit\r\n");

    
    let mut reader = BufReader::new(session.stdout);
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

#[tauri::command]
fn get_pools() -> String {
    let mut session = start_ssh_session().unwrap();
    
    // Disable pagination
    session.send(b"terminal length 0\r\n");
    thread::sleep(Duration::from_millis(300));

    session.send(b"show config\r\n");
    thread::sleep(Duration::from_secs(2));

    // Exit the session gracefully
    session.send(b"exit");

    
    let mut reader = BufReader::new(session.stdout);
    let mut buf = String::new();
    let mut pools : Vec<Pool> = Vec::new();

    loop{
        buf.clear();
        let num = reader.read_line(&mut buf).unwrap();
        if num == 0
        {
            break;
        }

        if buf.starts_with("voice register pool")
        {
            let mut byte_arr : Vec<u8> = Vec::new();
            reader.read_until(b'!', &mut byte_arr).unwrap();
            buf.push_str(&String::from_utf8_lossy(&byte_arr));

            let reg = Regex::new(r"(?ms)voice\s+register\s+pool\s+(\d+).*?id\s+mac\s+([A-F0-9.]+).*?number\s+\d+\s+dn\s+(\d+)(?:.*?paging-dn\s+(\d+))?").unwrap();
            if let Some(caps) = reg.captures(&buf) {
                pools.push(Pool {
                    id: caps.get(0).unwrap().as_str().parse().unwrap(),
                    mac: caps.get(1).unwrap().as_str().into(),
                    dn: caps.get(2).unwrap().as_str().parse().unwrap(),
                    paging_dn: caps.get(3).and_then(|m| m.as_str().parse::<i8>().ok())
                });
            }else {
                break;
            }
            
        }

        
    } 

    Value::to_string(&json!(pools))

}

#[tauri::command]
fn write_phone(dn : i8, name : String, label : String, number : i16, pickup : Option<i8>) -> String {
    let mut session = start_ssh_session().unwrap();

    // Disable pagination
    session.send(b"terminal length 0\r\n");
    thread::sleep(Duration::from_millis(300));

    session.send(b"config terminal\r\n");
    thread::sleep(Duration::from_secs(1));

    session.send(&format_bytes!(b"voice register dn {}\r\n", dn)[..]);
    thread::sleep(Duration::from_secs(1));

    session.send(&format_bytes!(b"number {}\r\nlabel {}\r\nname {}\r\n", number, label.as_bytes(), name.as_bytes())[..]);
    thread::sleep(Duration::from_secs(1));

    if let Some(group) = pickup {
        session.send(&format_bytes!(b"pickup-group {}\r\n", group)[..]);
        thread::sleep(Duration::from_secs(1));
    }else {
        session.send(b"no pickup-group {}\r\n");
        thread::sleep(Duration::from_secs(1));
    }

    session.send(b"voice register global\r\n");
    thread::sleep(Duration::from_secs(1));

    session.send(b"create profile\r\n");
    thread::sleep(Duration::from_secs(70));

    session.send(b"end\r\n");
    thread::sleep(Duration::from_secs(1));

    session.send(b"wr mem\r\n");
    thread::sleep(Duration::from_secs(2));

    // Exit the session gracefully
    session.send(b"exit\r\n");

    let mut reader = BufReader::new(session.stdout);
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
        .invoke_handler(tauri::generate_handler![get_phones, write_phone, set_credentials, get_pools])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
