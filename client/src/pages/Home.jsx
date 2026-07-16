import Header from "../components/Header/Header";

function Home() {
  return (
    <>
      <Header />

      <div style={{ padding: "40px" }}>
        <h1>Welcome to SyncSpace</h1>
        <p>Real-Time Collaborative Whiteboard & Code Editor</p>
      </div>
    </>
  );
}

export default Home;