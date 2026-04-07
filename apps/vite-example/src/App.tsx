import './App.css'
import { loadHumanizer } from '@ideadope/humanizer'
function App() {

  return (
    <>
      hi
      <button onClick={async () => {
        const humanizer = await loadHumanizer()

        const cleaned = humanizer.humanize("This is a robotic sentence\u200B created by an AI.")

        console.log(cleaned);
        
      }}>load</button>
    </>
  )
}

export default App
