'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Server, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Play,
  Search
} from 'lucide-react'
import { EditServerDialog } from './edit-server-dialog'

interface Server {
  id: string
  name: string
  hostname: string
  port: number
  username: string
  description?: string
  status: 'ONLINE' | 'OFFLINE' | 'ERROR'
  lastChecked?: string
  createdAt: string
}

interface ServerListProps {
  servers: Server[]
  onServersChange: () => void
}

export function ServerList({ servers, onServersChange }: ServerListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingServer, setEditingServer] = useState<Server | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm('Are you sure you want to delete this server?')) return

    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onServersChange()
      }
    } catch (error) {
      console.error('Failed to delete server:', error)
    }
  }

  const handleTestConnection = async (serverId: string) => {
    try {
      const response = await fetch(`/api/servers/${serverId}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        onServersChange()
      }
    } catch (error) {
      console.error('Failed to test connection:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <Badge className="bg-green-500">Online</Badge>
      case 'OFFLINE':
        return <Badge variant="secondary">Offline</Badge>
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Servers</CardTitle>
              <CardDescription>Manage your server infrastructure</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search servers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredServers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{server.name}</div>
                        {server.description && (
                          <div className="text-sm text-muted-foreground">
                            {server.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {server.hostname}:{server.port}
                      </div>
                    </TableCell>
                    <TableCell>{server.username}</TableCell>
                    <TableCell>{getStatusBadge(server.status)}</TableCell>
                    <TableCell>
                      {server.lastChecked ? 
                        new Date(server.lastChecked).toLocaleString() : 
                        'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(server.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleTestConnection(server.id)}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingServer(server)
                              setIsEditDialogOpen(true)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteServer(server.id)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No servers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first server'}
              </p>
              {!searchTerm && (
                <Button onClick={() => window.location.reload()}>
                  Add Server
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <EditServerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        server={editingServer}
        onServerUpdated={onServersChange}
      />
    </div>
  )
}