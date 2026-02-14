'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Bug, Lightbulb, Sparkles, Send, FileText, Wrench } from 'lucide-react';

const feedbackTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'border-red-200 hover:border-red-400 hover:bg-red-50' },
  { value: 'feature', label: 'Feature Request', icon: Sparkles, color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50' },
  { value: 'improvement', label: 'Improvement Suggestion', icon: Lightbulb, color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50' },
  { value: 'general', label: 'General Feedback', icon: MessageSquare, color: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50' },
  { value: 'tool_idea', label: 'Tool Idea', icon: Wrench, color: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50' },
  { value: 'article', label: 'Submit Blog Article', icon: FileText, color: 'border-green-200 hover:border-green-400 hover:bg-green-50' },
];

interface FeedbackDialogProps {
  hideTrigger?: boolean;
}

export function FeedbackDialog({ hideTrigger = false }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorBio, setAuthorBio] = useState('');

  const isArticleSubmission = selectedType === 'article';
  const isToolIdea = selectedType === 'tool_idea';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const feedbackType = params.get('feedback');
    if (!feedbackType) return;

    const isValidType = feedbackTypes.some((type) => type.value === feedbackType);
    if (!isValidType) return;

    setSelectedType(feedbackType);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onOpenFeedback = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: string }>;
      const type = customEvent.detail?.type;
      if (type) {
        const isValidType = feedbackTypes.some((feedbackType) => feedbackType.value === type);
        if (isValidType) {
          setSelectedType(type);
        }
      }
      setOpen(true);
    };

    window.addEventListener('open-feedback-dialog', onOpenFeedback as EventListener);
    return () => {
      window.removeEventListener('open-feedback-dialog', onOpenFeedback as EventListener);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_type: selectedType,
          subject,
          message,
          email: email || null,
          priority: isArticleSubmission ? 'medium' : priority,
          author_name: isArticleSubmission ? authorName : null,
          author_bio: isArticleSubmission ? authorBio : null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setSelectedType('');
          setSubject('');
          setMessage('');
          setEmail('');
          setPriority('medium');
          setAuthorName('');
          setAuthorBio('');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-orange-500" />
            Feedback Form
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            We&apos;d love to hear your thoughts, suggestions, or concerns.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Thank you!</h3>
            <p className="text-gray-600">
              {isArticleSubmission 
                ? "Your article has been submitted for review. We'll be in touch soon!"
                : isToolIdea
                ? "Thanks for the tool idea! We'll review it and add it to our roadmap."
                : "Your feedback has been submitted successfully."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-3 block">
                What type of feedback is this? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSelectedType(type.value)}
                      className={`p-4 border-2 rounded-xl transition-all text-left ${
                        selectedType === type.value
                          ? 'border-orange-500 bg-orange-50'
                          : type.color
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${selectedType === type.value ? 'text-orange-600' : 'text-gray-600'}`} />
                      <span className="font-medium text-sm">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isArticleSubmission && (
              <div>
                <label htmlFor="authorName" className="text-sm font-medium mb-2 block">
                  Author Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="authorName"
                  placeholder="Your name as it should appear on the article"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="subject" className="text-sm font-medium mb-2 block">
                {isArticleSubmission ? 'Article Title' : isToolIdea ? 'Tool Name' : 'Subject'} <span className="text-red-500">*</span>
              </label>
              <Input
                id="subject"
                placeholder={isArticleSubmission ? "Your article headline" : isToolIdea ? "e.g., Color Palette Generator, PDF Merger, etc." : "Brief description of your feedback"}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-medium mb-2 block">
                {isArticleSubmission ? 'Article Content' : isToolIdea ? 'Tool Description' : 'Message'} <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="message"
                placeholder={isArticleSubmission 
                  ? "Paste your full article content here. You can include formatting instructions in plain text..."
                  : isToolIdea
                  ? "Describe what the tool should do, who would use it, and why it would be valuable for creators..."
                  : "Please provide detailed information about your feedback..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={isArticleSubmission ? 12 : isToolIdea ? 6 : 5}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
              {isArticleSubmission && (
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Use plain text with clear paragraph breaks. We&apos;ll handle formatting.
                </p>
              )}
              {isToolIdea && (
                <p className="text-xs text-gray-500 mt-1">
                  Include example use cases and any similar tools you&apos;ve seen elsewhere.
                </p>
              )}
            </div>

            {isArticleSubmission && (
              <div>
                <label htmlFor="authorBio" className="text-sm font-medium mb-2 block">
                  Author Bio (optional)
                </label>
                <Textarea
                  id="authorBio"
                  placeholder="A short bio about yourself (1-2 sentences for the article byline)"
                  value={authorBio}
                  onChange={(e) => setAuthorBio(e.target.value)}
                  rows={2}
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-sm font-medium mb-2 block">
                Email {isArticleSubmission ? <span className="text-red-500">*</span> : '(for follow-up)'}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={isArticleSubmission}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
              {isArticleSubmission && (
                <p className="text-xs text-gray-500 mt-1">
                  We&apos;ll contact you about publishing decisions and any edits.
                </p>
              )}
            </div>

            {!isArticleSubmission && (
              <div>
                <label htmlFor="priority" className="text-sm font-medium mb-2 block">
                  Priority Level
                </label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General feedback</SelectItem>
                    <SelectItem value="medium">Medium - Standard feedback</SelectItem>
                    <SelectItem value="high">High - Important issue</SelectItem>
                    <SelectItem value="urgent">Urgent - Critical bug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              disabled={!selectedType || !subject || !message || loading || (isArticleSubmission && (!authorName || !email))}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-12"
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  {isArticleSubmission ? <FileText className="w-4 h-4 mr-2" /> : isToolIdea ? <Wrench className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {isArticleSubmission ? 'Submit Article for Review' : isToolIdea ? 'Submit Tool Idea' : 'Submit Feedback'}
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
