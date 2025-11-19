use json_completer::{JsonCompleter, ParsingState};
use serde_json;
use std::env;
use std::io::{self, Read};

fn print_usage() {
    eprintln!("json_completer - Complete partial/truncated JSON strings");
    eprintln!();
    eprintln!("Usage:");
    eprintln!("  json_completer <json_string>              Complete a JSON string");
    eprintln!("  json_completer --stdin                     Read from stdin and complete");
    eprintln!("  json_completer --incremental               Incremental mode (reads multiple inputs from stdin)");
    eprintln!("  json_completer --json-api                  JSON API mode for interop with other languages");
    eprintln!("  json_completer --help                      Show this help message");
    eprintln!();
    eprintln!("Examples:");
    eprintln!(r#"  json_completer '{{"name": "John", "age":'"#);
    eprintln!(r#"  echo '{{"incomplete"' | json_completer --stdin"#);
    eprintln!(r#"  echo '{{"action": "complete", "input": "{{\\"test\\"" }}' | json_completer --json-api"#);
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        // Read from stdin by default
        if let Ok(input) = read_stdin() {
            let result = JsonCompleter::complete(&input);
            println!("{}", result);
        } else {
            print_usage();
            std::process::exit(1);
        }
        return;
    }

    match args[1].as_str() {
        "--help" | "-h" => {
            print_usage();
        }
        "--stdin" => {
            match read_stdin() {
                Ok(input) => {
                    let result = JsonCompleter::complete(&input);
                    println!("{}", result);
                }
                Err(e) => {
                    eprintln!("Error reading stdin: {}", e);
                    std::process::exit(1);
                }
            }
        }
        "--incremental" => {
            run_incremental_mode();
        }
        "--json-api" => {
            run_json_api_mode();
        }
        other => {
            // Treat as JSON string to complete
            let result = JsonCompleter::complete(other);
            println!("{}", result);
        }
    }
}

fn read_stdin() -> io::Result<String> {
    let mut buffer = String::new();
    io::stdin().read_to_string(&mut buffer)?;
    Ok(buffer)
}

fn run_incremental_mode() {
    eprintln!("Incremental mode - enter JSON chunks (Ctrl+D to finish each chunk, Ctrl+C to exit):");
    let mut completer = JsonCompleter::new();
    let stdin = io::stdin();
    let mut accumulated = String::new();

    loop {
        let mut chunk = String::new();
        match stdin.read_line(&mut chunk) {
            Ok(0) => break, // EOF
            Ok(_) => {
                accumulated.push_str(&chunk);
                let result = completer.complete_incremental(&accumulated);
                println!("Completed: {}", result);
            }
            Err(e) => {
                eprintln!("Error reading input: {}", e);
                break;
            }
        }
    }
}

fn run_json_api_mode() {
    // JSON API for interop with other languages (Node.js, Bun, etc.)
    // Input format: {"action": "complete", "input": "partial json"}
    // or: {"action": "complete_incremental", "input": "partial json", "state": {...}}
    // Output format: {"result": "completed json"} or {"result": "...", "state": {...}}

    let stdin = io::stdin();
    let mut buffer = String::new();

    if let Err(e) = stdin.read_line(&mut buffer) {
        let error_response = serde_json::json!({
            "error": format!("Failed to read input: {}", e)
        });
        println!("{}", error_response);
        std::process::exit(1);
    }

    let request: serde_json::Value = match serde_json::from_str(&buffer) {
        Ok(v) => v,
        Err(e) => {
            let error_response = serde_json::json!({
                "error": format!("Invalid JSON input: {}", e)
            });
            println!("{}", error_response);
            std::process::exit(1);
        }
    };

    let action = request["action"].as_str().unwrap_or("complete");
    let input = match request["input"].as_str() {
        Some(s) => s,
        None => {
            let error_response = serde_json::json!({
                "error": "Missing 'input' field"
            });
            println!("{}", error_response);
            std::process::exit(1);
        }
    };

    match action {
        "complete" => {
            let result = JsonCompleter::complete(input);
            let response = serde_json::json!({
                "result": result
            });
            println!("{}", response);
        }
        "complete_incremental" => {
            let mut completer = if let Some(state_val) = request.get("state") {
                // Deserialize state
                match serde_json::from_value::<ParsingState>(state_val.clone()) {
                    Ok(state) => JsonCompleter::with_state(state),
                    Err(e) => {
                        let error_response = serde_json::json!({
                            "error": format!("Invalid state: {}", e)
                        });
                        println!("{}", error_response);
                        std::process::exit(1);
                    }
                }
            } else {
                JsonCompleter::new()
            };

            let result = completer.complete_incremental(input);
            let state = completer.get_state();

            let response = serde_json::json!({
                "result": result,
                "state": state
            });
            println!("{}", response);
        }
        "reset" => {
            let response = serde_json::json!({
                "result": "State reset",
                "state": ParsingState::new()
            });
            println!("{}", response);
        }
        _ => {
            let error_response = serde_json::json!({
                "error": format!("Unknown action: {}", action)
            });
            println!("{}", error_response);
            std::process::exit(1);
        }
    }
}
