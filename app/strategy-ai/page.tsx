"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { EmailCapture } from "@/components/email-capture";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestedProducts?: any[];
}

export default function StrategyAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/strategy-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        suggestedProducts: data.products || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble responding. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">AI Strategy Chat</h1>
          <p className="text-xl text-muted-foreground">
            Get personalized strategies and product recommendations for your creator business
          </p>
        </div>

        <div className="mb-8">
          <EmailCapture source="strategy-ai" />
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Ask me anything about growing your creator business!
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.suggestedProducts && message.suggestedProducts.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="font-semibold mb-2">Recommended products:</p>
                          <ul className="space-y-1">
                            {message.suggestedProducts.map((product: any) => (
                              <li key={product.id}>
                                <Link
                                  href={`/products/${product.slug}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {product.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                placeholder="Tell me about your business or ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1"
                rows={3}
              />
              <Button type="submit" disabled={loading}>
                {loading ? "..." : "Send"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Want the full PDF strategy guide?
          </p>
          <Link href="/store">
            <Button variant="outline">Browse Store</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
