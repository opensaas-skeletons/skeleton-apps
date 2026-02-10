import { useState, useCallback, useRef } from "react";
import type { Message, RetrievalResult } from "@shared/types/ai";
import { streamMessage, getConversation } from "../api/client";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sources, setSources] = useState<RetrievalResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const conversation = await getConversation(conversationId);
      setMessages(conversation.messages || []);
      setSources([]);
      setStreamingContent("");
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);

  const sendUserMessage = useCallback(
    async (conversationId: string, content: string, sourceIds?: string[]) => {
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingContent("");
      setSources([]);

      const controller = new AbortController();
      abortRef.current = controller;

      let fullContent = "";
      let messageSources: RetrievalResult[] = [];
      let model: string | undefined;

      try {
        for await (const chunk of streamMessage(
          conversationId,
          { content, source_ids: sourceIds },
          controller.signal
        )) {
          if (chunk.type === "token" && chunk.content) {
            fullContent += chunk.content;
            setStreamingContent(fullContent);
          } else if (chunk.type === "sources" && chunk.sources) {
            messageSources = chunk.sources;
            setSources(chunk.sources);
          } else if (chunk.type === "done") {
            model = chunk.model;
          } else if (chunk.type === "error") {
            throw new Error(chunk.error || "Stream error");
          }
        }

        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          conversation_id: conversationId,
          role: "assistant",
          content: fullContent,
          sources: messageSources.length > 0 ? messageSources : undefined,
          model,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        if (err.name === "AbortError") {
          if (fullContent) {
            const partialMessage: Message = {
              id: `msg-${Date.now()}`,
              conversation_id: conversationId,
              role: "assistant",
              content: fullContent + "\n\n*[Generation stopped]*",
              sources: messageSources.length > 0 ? messageSources : undefined,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, partialMessage]);
          }
        } else {
          const errorMessage: Message = {
            id: `err-${Date.now()}`,
            conversation_id: conversationId,
            role: "assistant",
            content: `Error: ${err.message || "Failed to generate response"}`,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        abortRef.current = null;
      }
    },
    []
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    isStreaming,
    streamingContent,
    sources,
    sendMessage: sendUserMessage,
    stopGeneration,
    loadMessages,
  };
}
