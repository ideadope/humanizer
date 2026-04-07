import { useState } from 'react';
import './App.css'
import { loadHumanizer, humanizer } from '@ideadope/humanizer'

function App() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await loadHumanizer();
          const cleaned = humanizer.humanize("...");
          console.log(cleaned);
        } catch (err) {
          console.error("error", err)
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "Initializing..." : "Load"}
    </button>
  );
}

export default App
