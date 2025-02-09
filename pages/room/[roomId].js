import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { database } from "../../utils/firebaseConfig";
import { ref, push, set, onValue, update } from "firebase/database";

export default function Room() {
  const router = useRouter();
  const { roomId } = router.query;
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [assignedWord, setAssignedWord] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatDisabled, setIsChatDisabled] = useState(false);
  const [isVotingPhase, setIsVotingPhase] = useState(false); // 🔹 投票フェーズ開始フラグ
  const [selectedVote, setSelectedVote] = useState(""); // 🔹 投票するプレイヤーを選択
  const [votes, setVotes] = useState({}); // 🔹 投票のカウント
  const [timer, setTimer] = useState(null); // 🔹 タイマーを管理
  const [chatMessages, setChatMessages] = useState([]);
  const [isHost, setIsHost] = useState(false); // 🔹 ホスト判定の状態を追加
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null);


  const words = {
    majority: "Chog",
    minority: "molandak"
  };

  // プレイヤーを登録
  const addPlayer = () => {
    if (playerName.trim() !== "") {
      const playerRef = ref(database, `rooms/${roomId}/players`);
      const newPlayerRef = push(playerRef);
      set(newPlayerRef, { name: playerName, word: null }).then(() => {
        if (players.length === 0) {
          setIsHost(true); // 🔹 最初のプレイヤーをホストに設定
        }
      });
    }
  };

  // ワードを配布（ホストのみ実行 & タイマー開始）
  const assignWords = () => {
    if (players.length < 3) {
      alert("3人以上でワードを配布できます！");
      return;
    }
  
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const minorityIndex = Math.floor(players.length * 0.2) || 1;
  
    shuffledPlayers.forEach((player, index) => {
      const playerRef = ref(database, `rooms/${roomId}/players/${player.id}`);
      update(playerRef, {
        word: index < minorityIndex ? words.minority : words.majority
      });
    });
  
    // 🔹 タイマーを Firebase に保存してスタート（60秒）
    const timerRef = ref(database, `rooms/${roomId}/timer`);
    set(timerRef, { time: 60 });
  
    // 🔹 チャットを有効化
    setIsChatDisabled(false);
  };


  // メッセージを送信
const sendMessage = () => {
  if (chatMessage.trim() !== "") {
    const chatRef = ref(database, `rooms/${roomId}/chat`);
    push(chatRef, { name: playerName, message: chatMessage, timestamp: Date.now() });
    setChatMessage(""); // メッセージ送信後に入力フィールドをリセット
  }
};

// 🔹 投票を Firebase に保存
const castVote = () => {
  if (!selectedVote) {
    alert("投票する相手を選んでください！");
    return;
  }

  const voteRef = ref(database, `rooms/${roomId}/votes/${playerName}`); // 🔹 プレイヤー名をキーにする
  set(voteRef, { votedFor: selectedVote }) // 🔹 `push` ではなく `set` にする
    .then(() => {
      alert("投票が完了しました！");
      setSelectedVote(""); // 🔹 投票後にリセット
    })
    .catch((error) => {
      console.error("投票エラー:", error);
    });
};

// 🔹 投票結果をカウント
const countVotes = () => {
  if (!votes || Object.keys(votes).length < players.length) {
    alert("全員が投票するまで待ってください！");
    return;
  }

  const voteCounts = {};
  players.forEach((player) => {
    voteCounts[player.name] = 0;
  });

  Object.values(votes).forEach((vote) => {
    if (voteCounts[vote.votedFor] !== undefined) {
      voteCounts[vote.votedFor]++;
    }
  });

  const maxVotes = Math.max(...Object.values(voteCounts));
  const eliminatedCandidates = Object.keys(voteCounts).filter(
    (name) => voteCounts[name] === maxVotes
  );

  if (eliminatedCandidates.length === 0) {
    alert("誰も追放されませんでした！");
    return;
  }

  const eliminated = eliminatedCandidates[Math.floor(Math.random() * eliminatedCandidates.length)];

  alert(`追放されたプレイヤー: ${eliminated}`);

  // 🔹 投票結果を Firebase に保存
  const resultRef = ref(database, `rooms/${roomId}/result`);
  set(resultRef, { eliminated });

  // 🔹 投票データをリセット
  const votesRef = ref(database, `rooms/${roomId}/votes`);
  set(votesRef, {});
};

  // プレイヤー & チャットメッセージをリアルタイム取得
  useEffect(() => {
    if (!roomId) return;
  
    const timerRef = ref(database, `rooms/${roomId}/timer`);
    onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTimer(data.time);
        if (data.time === 0) {
          setIsChatDisabled(true); // 🔹 0秒になったらチャットを無効化
          setIsVotingPhase(true); // 🔹 投票フェーズ開始
        }
      }
    });
    const votesRef = ref(database, `rooms/${roomId}/votes`);
      onValue(votesRef, (snapshot) => {
        const voteData = snapshot.val();
        if (voteData) {
          setVotes(voteData);
      }
      });
    

    const playerListRef = ref(database, `rooms/${roomId}/players`);
    onValue(playerListRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playerArray = Object.entries(data).map(([id, player]) => ({
          id,
          ...player
        }));
        setPlayers(playerArray);

        const currentPlayer = playerArray.find((p) => p.name === playerName);
        if (currentPlayer) {
          setAssignedWord(currentPlayer.word);
          setIsHost(playerArray[0].name === playerName); // 🔹 ホスト判定を修正
        }
      }
    });

    const chatRef = ref(database, `rooms/${roomId}/chat`);
    onValue(chatRef, (snapshot) => {
      const chatData = snapshot.val();
      if (chatData) {
        setChatMessages(Object.values(chatData).sort((a, b) => a.timestamp - b.timestamp));
      }
    });

    const resultRef = ref(database, `rooms/${roomId}/result`);
     onValue(resultRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.eliminated) {
      setEliminatedPlayer(data.eliminated);
    }
  });
  }, [roomId, playerName]);

// 🔹 タイマーのリアルタイム取得の useEffect のすぐ下に追加
useEffect(() => {
  if (!isHost || timer === null || timer <= 0) return;

  const interval = setInterval(() => {
    const timerRef = ref(database, `rooms/${roomId}/timer`);
    set(timerRef, { time: Math.max(timer - 1, 0) });
  }, 1000);

  return () => clearInterval(interval);
}, [timer, isHost, roomId])



  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold">ルーム ID: {roomId}</h1>
      
      <div className="mt-4">
        <input
          type="text"
          placeholder="名前を入力"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="border px-4 py-2 rounded"
        />
        <button
          onClick={addPlayer}
          className="bg-green-500 text-white px-4 py-2 rounded ml-2"
        >
          参加
        </button>
      </div>

      <h2 className="text-xl font-semibold mt-4">プレイヤーリスト</h2>
      <ul className="mt-2">
        {players.map((player) => (
          <li key={player.id} className="p-2 bg-gray-200 rounded my-1">
            {player.name}
          </li>
        ))}
      </ul>

      {timer !== null && (
        <h2 className="text-xl font-semibold mt-4">議論タイム: {timer} 秒</h2>
      )}

      {assignedWord && (
        <h2 className="text-xl font-semibold mt-4">あなたのワード: {assignedWord}</h2>
      )}

      {isHost && (
        <button
          onClick={assignWords}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
        >
          ワードを配布
        </button>
      )}

      <h2 className="text-xl font-semibold mt-4">議論チャット</h2>
      <div className="w-96 h-48 bg-white shadow-md p-4 overflow-auto">
        {chatMessages.map((msg, index) => (
          <p key={index} className="p-1 bg-gray-200 rounded mb-1">
            <strong>{msg.name}:</strong> {msg.message}
          </p>
        ))}
      </div>

      <div className="mt-2 flex">
      <input
        type="text"
        placeholder="メッセージを入力"
        value={chatMessage}
        onChange={(e) => setChatMessage(e.target.value)}
        className="border px-4 py-2 rounded w-72"
        disabled={isChatDisabled}
      />
      <button
        onClick={sendMessage}
        className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
        disabled={isChatDisabled}
      >
        送信
      </button>
      </div>
      {isVotingPhase && (
      <>
        <h2 className="text-xl font-semibold mt-4">投票</h2>
        <select
            className="border px-4 py-2 rounded"
            value={selectedVote}
            onChange={(e) => setSelectedVote(e.target.value)}
          >
            <option value="">投票する相手を選択</option>
            {players.map((player) => (
              <option key={player.id} value={player.name}>
                {player.name}
              </option>
            ))}
          </select>
          <button
            onClick={castVote}
            className="bg-red-500 text-white px-4 py-2 rounded ml-2"
            disabled={!selectedVote || votes[playerName]} // 🔹 すでに投票済みなら無効化
          >
            投票
          </button>

          {isHost && (
            <button
              onClick={countVotes}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
              投票結果を発表
            </button>
          )}

          {eliminatedPlayer && (
            <h2 className="text-xl font-semibold mt-4 text-red-500">
              追放されたプレイヤー: {eliminatedPlayer}
            </h2>
          )}
        </>
      )}

    </div>
  );
}
