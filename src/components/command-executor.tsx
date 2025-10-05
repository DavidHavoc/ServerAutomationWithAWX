'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Terminal, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Copy,
  RefreshCw
} from 'lucide-react'

interface Server {
  id: string
  name: string
  hostname: string
  status: 'ONLINE' | 'OFFLINE' | 'ERROR'
}

interface CommandLog {
  id: string
  command: string
  output?: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT'
  startTime: string
  endTime?: string
  duration?: number
  server: {
    name: string
    hostname: string
  }
  user: {
    name: string
    email: string
  }
}

interface CommandExecutorProps {
  servers: Server[]
}

export function CommandExecutor({ servers }: CommandExecutorProps) {
  const [selectedServer, setSelectedServer] = useState('')
  const [command, setCommand] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [commandHistory, setCommandHistory] = useState<CommandLog[]>([])
  const [activeTab, setActiveTab] = useState('execute')

  const onlineServers = servers.filter(s => s.status === 'ONLINE')

  const executeCommand = async () => {
    if (!selectedServer || !command.trim()) return

    setIsExecuting(true)

    try {
      const response = await fetch('/api/commands/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId: selectedServer,
          command: command.trim()
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setCommandHistory(prev => [result, ...prev])
        setCommand('')
      }
    } catch (error) {
      console.error('Failed to execute command:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  const fetchCommandHistory = async () => {
    try {
      const response = await fetch('/api/commands/history')
      if (response.ok) {
        const data = await response.json()
        setCommandHistory(data)
      }
    } catch (error) {
      console.error('Failed to fetch command history:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'TIMEOUT':
        return <XCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'RUNNING':
        return <Badge className="bg-blue-500">Running</Badge>
      case 'SUCCESS':
        return <Badge className="bg-green-500">Success</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      case 'TIMEOUT':
        return <Badge className="bg-orange-500">Timeout</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const commonCommands = [
    { name: 'System Info', command: 'uname -a && df -h && free -m' },
    { name: 'Running Services', command: 'systemctl list-units --type=service --state=running' },
    { name: 'Network Status', command: 'ip addr show && ss -tuln' },
    { name: 'Disk Usage', command: 'du -sh /* 2>/dev/null | sort -hr | head -10' },
    { name: 'Process List', command: 'ps aux --sort=-%cpu | head -20' },
    { name: 'System Uptime', command: 'uptime && w' }
  ]

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="execute">Execute Command</TabsTrigger>
          <TabsTrigger value="history">Command History</TabsTrigger>
        </TabsList>

        <TabsContent value="execute" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Execute Command
              </CardTitle>
              <CardDescription>
                Run commands on your remote servers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="server">Select Server</Label>
                  <Select value={selectedServer} onValueChange={setSelectedServer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a server" />
                    </SelectTrigger>
                    <SelectContent>
                      {onlineServers.length > 0 ? (
                        onlineServers.map((server) => (
                          <SelectItem key={server.id} value={server.id}>
                            {server.name} ({server.hostname})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No online servers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="command">Command</Label>
                <Textarea
                  id="command"
                  placeholder="Enter command to execute..."
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  rows={3}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Commands</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonCommands.map((cmd) => (
                    <Button
                      key={cmd.name}
                      variant="outline"
                      size="sm"
                      onClick={() => setCommand(cmd.command)}
                      className="text-xs h-auto py-2 px-3 whitespace-normal"
                    >
                      {cmd.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={executeCommand}
                disabled={!selectedServer || !command.trim() || isExecuting}
                className="w-full"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Execute Command
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Command History</CardTitle>
                  <CardDescription>
                    View recent command executions and their results
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchCommandHistory}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {commandHistory.length > 0 ? (
                <div className="space-y-4">
                  {commandHistory.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="font-medium">{log.server.name}</p>
                            <p className="text-sm text-muted-foreground">{log.server.hostname}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          {log.duration && (
                            <span className="text-sm text-muted-foreground">
                              {log.duration}ms
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Command</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(log.command)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="bg-muted p-2 rounded font-mono text-sm">
                          {log.command}
                        </div>
                      </div>

                      {log.output && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Output</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(log.output)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="bg-muted p-2 rounded font-mono text-sm max-h-48 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{log.output}</pre>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>By {log.user.name} ({log.user.email})</span>
                        <span>
                          {new Date(log.startTime).toLocaleString()}
                          {log.endTime && ` - ${new Date(log.endTime).toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No command history</h3>
                  <p className="text-muted-foreground">
                    Execute commands to see their history here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}