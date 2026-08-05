import MainLayout from "../layouts/MainLayout";

function Home() {
  return (
    <MainLayout>
      <div style={{ padding: "40px" }}>
        <h1>Welcome to SyncSpace</h1>

        <p>
          Real-Time Collaborative Whiteboard & Code Editor
        </p>
      </div>
    </MainLayout>
  );
}

export default Home;