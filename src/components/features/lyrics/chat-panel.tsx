"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: Date
}

export interface ChatPanelProps {
  /**
   * 消息列表
   */
  messages: Message[]
  /**
   * 是否正在加载
   */
  isLoading?: boolean
  /**
   * 快捷建议按钮列表
   */
  suggestions?: string[]
  /**
   * 发送消息的回调
   */
  onSend: (message: string) => void
  /**
   * 点击建议的回调
   */
  onSuggestionClick?: (suggestion: string) => void
  /**
   * 占位符文本
   */
  placeholder?: string
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 禁用输入
   */
  disabled?: boolean
}

const LoadingDots = () => {
  return (
    <div className="flex items-center space-x-1.5 px-4 py-2">
      <motion.div
        className="h-2 w-2 rounded-full bg-secondary"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0,
        }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-secondary"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.2,
        }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-secondary"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.4,
        }}
      />
    </div>
  )
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-white rounded-br-md"
            : "bg-card text-foreground border border-border rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.timestamp && (
          <p
            className={cn(
              "text-xs mt-1.5",
              isUser ? "text-white/60" : "text-muted"
            )}
          >
            {message.timestamp.toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </motion.div>
  )
}

const SuggestionButton = ({
  suggestion,
  onClick,
}: {
  suggestion: string
  onClick: () => void
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-4 py-2 rounded-full bg-card border border-border hover:border-primary hover:text-primary transition-colors text-sm text-foreground"
    >
      {suggestion}
    </motion.button>
  )
}

export const ChatPanel = React.forwardRef<HTMLDivElement, ChatPanelProps>(
  (
    {
      messages,
      isLoading = false,
      suggestions,
      onSend,
      onSuggestionClick,
      placeholder = "输入你的消息...",
      className,
      disabled = false,
    },
    ref
  ) => {
    const [input, setInput] = React.useState("")
    const messagesEndRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // 自动滚动到底部
    const scrollToBottom = React.useCallback(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [])

    React.useEffect(() => {
      scrollToBottom()
    }, [messages, isLoading, scrollToBottom])

    const handleSend = () => {
      const trimmedInput = input.trim()
      if (trimmedInput && !disabled && !isLoading) {
        onSend(trimmedInput)
        setInput("")
        inputRef.current?.focus()
      }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }

    const handleSuggestionClick = (suggestion: string) => {
      if (onSuggestionClick) {
        onSuggestionClick(suggestion)
      } else {
        onSend(suggestion)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full bg-background border border-border rounded-2xl overflow-hidden",
          className
        )}
      >
        {/* 消息列表区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>

          {/* Loading 状态 */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-start"
              >
                <div className="bg-card border border-border rounded-2xl rounded-bl-md">
                  <LoadingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 快捷建议按钮 */}
        {suggestions && suggestions.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <SuggestionButton
                  key={index}
                  suggestion={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || disabled || isLoading}
              loading={isLoading}
              size="icon"
              aria-label="发送消息"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }
)

ChatPanel.displayName = "ChatPanel"
