import {decToUd} from "@urbit/api";
import React from "react";
import api from "../api";
import { ChatWrit } from "../types/chat";

interface ChatMessageProps {
  writ: ChatWrit;
}

export function ChatMessage(props: ChatMessageProps) {
  const { writ } = props;
  const { seal, memo } = writ;

  const onDelete = () => {
    api.poke({
      app: "chat",
      mark: "chat-action",
      json: {
        flag: "~zod/test",
        update: {
          time: "",
          diff: {
            del: writ.seal.time
          },
        },
      },
    });

  }

  return (
    <div className="flex flex-col">
      <div className="flex space-between">
        <div className="flex text-mono space-x-2">
          <div>{memo.author}</div>
          <div>{seal.time}</div>
        </div>
        <button onClick={onDelete}>
          Delete
        </button>
      </div>
      <div>{memo.content}</div>
    </div>
  );
}
