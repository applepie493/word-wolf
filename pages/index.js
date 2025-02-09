import { useState } from "react";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";


export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  // ルームを作成
  const createRoom = () => {
    const newRoomId = uuidv4().slice(0, 6); // 短縮ID生成
    setRoomId(newRoomId);
    router.push(`/room/${newRoomId}`);
  };

  // ルームに参加
  const joinRoom = () => {
    if (roomId.trim() !== "") {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">ワードウルフゲーム</h1>
      <button
        onClick={createRoom}
        className="bg-blue-500 text-white px-6 py-2 rounded-lg mb-4"
      >
        ルームを作成
      </button>
      <input
        type="text"
        placeholder="ルームIDを入力"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="border px-4 py-2 rounded-md mb-2"
      />
      <button
        onClick={joinRoom}
        className="bg-green-500 text-white px-6 py-2 rounded-lg"
      >
        ルームに参加
      </button>
    </div>
  );
}
