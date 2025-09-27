import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "alexa";
  timestamp: Date;
}

interface AlexaVoiceChatProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function AlexaVoiceChat({
  isOpen,
  onToggle,
  className,
}: AlexaVoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your factory assistant. You can ask me about device status, energy consumption, safety alerts, or optimization suggestions.",
      sender: "alexa",
      timestamp: new Date(),
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateVoiceResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("status") || lowerMessage.includes("device")) {
      return "I can see 19 devices in the factory. 15 are running normally, 3 have warnings, and 1 is critical. Would you like details on any specific device?";
    } else if (
      lowerMessage.includes("energy") ||
      lowerMessage.includes("power")
    ) {
      return "Current total energy consumption is 8,750 watts. The Hydraulic Press and CNC Mills are consuming the most power. I can suggest optimization strategies.";
    } else if (
      lowerMessage.includes("alert") ||
      lowerMessage.includes("problem")
    ) {
      return "There are 4 active alerts: 1 critical failure in CNC-003, and 3 efficiency warnings. The critical issue requires immediate attention.";
    } else if (
      lowerMessage.includes("shutdown") ||
      lowerMessage.includes("restart")
    ) {
      return "I can help you remotely control devices. Which device would you like to shutdown or restart? Please specify the device ID.";
    } else if (
      lowerMessage.includes("efficiency") ||
      lowerMessage.includes("oee")
    ) {
      return "Overall Equipment Effectiveness is currently at 87.3%. Production Line 1 is performing best at 94%, while Assembly Station needs attention at 78%.";
    } else {
      return "I'm here to help with your factory operations. You can ask me about device status, energy consumption, alerts, or request remote control actions.";
    }
  };

  const handleVoiceToggle = () => {
    if (!isListening) {
      setIsListening(true);

      // Simulate voice recognition
      setTimeout(() => {
        const simulatedUserMessage = "What's the status of all devices?"; // This would be actual voice recognition

        const newUserMessage: Message = {
          id: Date.now().toString(),
          text: simulatedUserMessage,
          sender: "user",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newUserMessage]);
        setIsListening(false);

        // Simulate Alexa response
        setTimeout(() => {
          setIsSpeaking(true);
          const response = simulateVoiceResponse(simulatedUserMessage);

          const alexaMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response,
            sender: "alexa",
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, alexaMessage]);

          setTimeout(() => {
            setIsSpeaking(false);
          }, 2000);
        }, 1000);
      }, 3000);
    } else {
      setIsListening(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card
      className={cn(
        "fixed bottom-4 right-4 z-50 w-80",
        "shadow-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50",
        isMinimized && "h-16",
        !isMinimized && "h-96",
        className
      )}
    >
      <CardHeader className="pb-2 bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Alexa Assistant
            {(isListening || isSpeaking) && (
              <div className="flex gap-1">
                <div
                  className="w-1 h-1 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1 h-1 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1 h-1 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              {isMinimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-80">
          <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-2 rounded-lg text-sm",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-card border border-border text-card-foreground rounded-bl-none"
                    )}
                  >
                    <p>{message.text}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        message.sender === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isListening && (
                <div className="flex justify-end">
                  <div className="bg-gray-100 border border-gray-200 rounded-lg rounded-br-none p-2 text-sm text-gray-600">
                    Listening...
                  </div>
                </div>
              )}

              {isSpeaking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none p-2 text-sm text-gray-600">
                    Speaking...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isListening ? "destructive" : "default"}
                size="sm"
                onClick={handleVoiceToggle}
                disabled={isSpeaking}
                className={cn(
                  "flex-1",
                  isListening && "animate-pulse bg-red-500 hover:bg-red-600"
                )}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Chat
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!isSpeaking}
              >
                {isSpeaking ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
