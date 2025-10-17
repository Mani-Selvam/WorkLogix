import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import type { User, Message, GroupMessage } from "@shared/schema";

export default function AdminMessages() {
  const { toast } = useToast();
  const { dbUserId } = useAuth();
  const [privateMessageForm, setPrivateMessageForm] = useState({
    receiverId: "",
    message: "",
  });
  const [groupMessageForm, setGroupMessageForm] = useState({
    title: "",
    message: "",
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: privateMessages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });

  const { data: groupMessages = [] } = useQuery<GroupMessage[]>({
    queryKey: ['/api/group-messages'],
  });

  const sendPrivateMessageMutation = useMutation({
    mutationFn: async (messageData: typeof privateMessageForm) => {
      return await apiRequest('POST', '/api/messages', {
        senderId: dbUserId,
        receiverId: parseInt(messageData.receiverId),
        message: messageData.message,
        readStatus: false,
      });
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully",
      });
      setPrivateMessageForm({ receiverId: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendGroupMessageMutation = useMutation({
    mutationFn: async (messageData: typeof groupMessageForm) => {
      return await apiRequest('POST', '/api/group-messages', {
        title: messageData.title || null,
        message: messageData.message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Announcement sent successfully",
      });
      setGroupMessageForm({ title: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/group-messages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send announcement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getUserNameById = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.displayName || "Unknown User";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
          Communication Center
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Send messages and announcements
        </p>
      </div>

      <Tabs defaultValue="private" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="private" data-testid="tab-private-messages" className="text-xs sm:text-sm">
            Private Messages
          </TabsTrigger>
          <TabsTrigger value="announcements" data-testid="tab-announcements" className="text-xs sm:text-sm">
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="private" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Send Private Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-user" className="text-xs sm:text-sm">Select User</Label>
                <Select 
                  value={privateMessageForm.receiverId} 
                  onValueChange={(value) => setPrivateMessageForm({ ...privateMessageForm, receiverId: value })}
                >
                  <SelectTrigger id="message-user" data-testid="select-message-user">
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role === 'company_member').map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="private-message" className="text-xs sm:text-sm">Message</Label>
                <Textarea
                  id="private-message"
                  placeholder="Type your message..."
                  value={privateMessageForm.message}
                  onChange={(e) => setPrivateMessageForm({ ...privateMessageForm, message: e.target.value })}
                  data-testid="textarea-private-message"
                  rows={4}
                />
              </div>
              <Button 
                onClick={() => sendPrivateMessageMutation.mutate(privateMessageForm)}
                disabled={!privateMessageForm.receiverId || !privateMessageForm.message || sendPrivateMessageMutation.isPending}
                data-testid="button-send-private-message"
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {sendPrivateMessageMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Recent Messages ({privateMessages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {privateMessages.slice(0, 10).map((msg) => (
                  <div key={msg.id} className="bg-muted/50 border rounded-lg p-3" data-testid={`message-${msg.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs sm:text-sm font-medium">{getUserNameById(msg.senderId)}</span>
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-xs sm:text-sm font-medium">{getUserNameById(msg.receiverId)}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{msg.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap ml-2">
                        {format(new Date(msg.createdAt), "MMM dd, HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
                {privateMessages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No messages yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Send Announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-title" className="text-xs sm:text-sm">Title (Optional)</Label>
                <Input
                  id="announcement-title"
                  placeholder="Announcement title..."
                  value={groupMessageForm.title}
                  onChange={(e) => setGroupMessageForm({ ...groupMessageForm, title: e.target.value })}
                  data-testid="input-announcement-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-message" className="text-xs sm:text-sm">Message *</Label>
                <Textarea
                  id="announcement-message"
                  placeholder="Type your announcement..."
                  value={groupMessageForm.message}
                  onChange={(e) => setGroupMessageForm({ ...groupMessageForm, message: e.target.value })}
                  data-testid="textarea-announcement-message"
                  rows={4}
                />
              </div>
              <Button 
                onClick={() => sendGroupMessageMutation.mutate(groupMessageForm)}
                disabled={!groupMessageForm.message || sendGroupMessageMutation.isPending}
                data-testid="button-send-announcement"
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {sendGroupMessageMutation.isPending ? "Sending..." : "Send Announcement"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Recent Announcements ({groupMessages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupMessages.slice(0, 10).map((msg) => (
                  <div key={msg.id} className="bg-muted/50 border rounded-lg p-3" data-testid={`announcement-${msg.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {msg.title && (
                          <h4 className="font-semibold text-sm sm:text-base mb-1">{msg.title}</h4>
                        )}
                        <p className="text-xs sm:text-sm text-muted-foreground">{msg.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap ml-2">
                        {format(new Date(msg.createdAt), "MMM dd, HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
                {groupMessages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No announcements yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
