'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Server, 
  Plus, 
  Activity, 
  Users, 
  Terminal, 
  LogOut, 
  User,
  Shield
} from 'lucide-react'
import { ServerList } from '@/components/server-list'
import { AddServerDialog } from '@/components/add-server-dialog'
import { CommandExecutor } from '@/components/command-executor'
import { ActivityLogs } from '@/components/activity-logs'
import { UserManagement } from '@/components/user-management'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Server {
  id: string
  name: string
  hostname: string
  status: 'ONLINE' | 'OFFLINE' | 'ERROR'
  lastChecked?: string
  description?: string
}

function DashboardContent() {
  const { user, logout } = useAuth()
  const [servers, setServers] = useState<Server[]>([])
  const [isAddServerOpen, setIsAddServerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchServers()
  }, [])

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers')
      if (response.ok) {
        const data = await response.json()
        setServers(data)
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error)
    }
  }

  const onlineServers = servers.filter(s => s.status === 'ONLINE').length
  const offlineServers = servers.filter(s => s.status === 'OFFLINE').length
  const errorServers = servers.filter(s => s.status === 'ERROR').length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Server Automation Platform</h1>
            <p className="text-muted-foreground">Manage and automate your server infrastructure</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsAddServerOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Server
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {user?.name || user?.email}
                  {user?.role === 'ADMIN' && <Shield className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user?.name || 'User'}</div>
                  <div className="text-muted-foreground">{user?.email}</div>
                  <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'} className="mt-1">
                    {user?.role}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="commands">Commands</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            {user?.role === 'ADMIN' && (
              <TabsTrigger value="users">Users</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{servers.length}</div>
                  <p className="text-xs text-muted-foreground">Registered servers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Online</CardTitle>
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{onlineServers}</div>
                  <p className="text-xs text-muted-foreground">Currently online</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Offline</CardTitle>
                  <div className="h-2 w-2 bg-gray-500 rounded-full" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{offlineServers}</div>
                  <p className="text-xs text-muted-foreground">Currently offline</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Errors</CardTitle>
                  <div className="h-2 w-2 bg-red-500 rounded-full" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{errorServers}</div>
                  <p className="text-xs text-muted-foreground">Connection errors</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Servers</CardTitle>
                <CardDescription>Latest server status updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {servers.slice(0, 5).map((server) => (
                    <div key={server.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          server.status === 'ONLINE' ? 'bg-green-500' :
                          server.status === 'OFFLINE' ? 'bg-gray-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">{server.name}</p>
                          <p className="text-sm text-muted-foreground">{server.hostname}</p>
                        </div>
                      </div>
                      <Badge variant={
                        server.status === 'ONLINE' ? 'default' :
                        server.status === 'OFFLINE' ? 'secondary' : 'destructive'
                      }>
                        {server.status}
                      </Badge>
                    </div>
                  ))}
                  {servers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No servers registered yet</p>
                      <Button variant="outline" className="mt-2" onClick={() => setIsAddServerOpen(true)}>
                        Add your first server
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servers">
            <ServerList servers={servers} onServersChange={fetchServers} />
          </TabsContent>

          <TabsContent value="commands">
            <CommandExecutor servers={servers} />
          </TabsContent>

          <TabsContent value="logs">
            <ActivityLogs />
          </TabsContent>

          {user?.role === 'ADMIN' && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>

        <AddServerDialog 
          open={isAddServerOpen} 
          onOpenChange={setIsAddServerOpen}
          onServerAdded={fetchServers}
        />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}