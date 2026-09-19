# ORBITAL Voice Assistant Documentation

**ORBITAL Voice** is an integrated, hands-free telemetry and workflow assistant designed to operate within simulated aerospace control environments.

---

## 1. Architectural Design

The assistant is implemented via React and the W3C **Web Speech API**:
- **SpeechRecognition / webkitSpeechRecognition**: Captures microphone input locally in the browser and generates normalized text transcripts.
- **SpeechSynthesis**: Generates audio responses through local device speech engines without outbound network round-trips.
- **Zustand Dispatcher**: Maps recognized intentions to application actions, updating UI navigation, simulation parameters, and status indicators.

---

## 2. Supported Commands

### Navigation Commands
| Spoken Phrase | Action Performed |
| :--- | :--- |
| `"Go to experiment setup"` / `"Step 1"` | Transitions view to Step 1: Setup |
| `"Go to data collection"` / `"Step 2"` | Transitions view to Step 2: Ingestion |
| `"Show activity recognition"` / `"Step 3"` | Transitions view to Step 3: AI Inference |
| `"Show results"` / `"Step 4"` | Transitions view to Step 4: Analysis |
| `"Open report"` / `"Step 5"` | Transitions view to Step 5: Report |
| `"Next step"` | Advances stepper forward |
| `"Go back"` / `"Previous step"` | Steps backward |

### Simulation & Telemetry Controls
| Spoken Phrase | Action Performed |
| :--- | :--- |
| `"Start simulation"` / `"Start stream"` | Activates 50 Hz synthetic telemetry generator |
| `"Pause simulation"` / `"Pause stream"` | Halts real-time batch accumulation |
| `"Reset simulation"` / `"Clear data"` | Purges telemetry buffer and resets counters |

### Analysis & Queries
| Spoken Phrase | Spoken Response |
| :--- | :--- |
| `"Show current activity"` | Speaks latest classified activity and percentage confidence |
| `"Summarize the experiment"` | Recites experiment name, data source, and sample count |
| `"Explain sensor readings"` | Explains tri-axial accelerometer and gyroscope axes |
| `"How does the AI model work?"` | Summarizes 48-feature extraction and Random Forest ensemble |
| `"What does this application do?"` | Explains SIH26174 prototype objectives |

---

## 3. Safety & Privacy Guardrails

1. **Zero External Audio Transmission**: Audio is never streamed or uploaded to third-party cloud APIs.
2. **Whitelisted Execution**: The assistant parses intent exclusively against an explicit dictionary of commands. No arbitrary bash, shell, terminal, or git commands can be invoked via voice.
3. **Graceful Fallback**: If the browser lacks microphone permissions or does not support speech recognition, the assistant gracefully falls back to text-based interaction without crashing.
