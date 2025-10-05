'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'

interface Server {
  id: string
  name: string
  hostname: string
  port: number
  username: string
  description?: string
  authType: 'PASSWORD' | 'PRIVATE_KEY'
}

interface EditServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  server: Server | null
  onServerUpdated: () => void
}

export function EditServerDialog({ open, onOpenChange, server, onServerUpdated }: EditServerDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    hostname: '',
    port: '22',
    username: '',
    description: '',
    authType: 'PASSWORD' as 'PASSWORD' | 'PRIVATE_KEY',
    password: '',
    privateKey: ''
  })

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name,
        hostname: server.hostname,
        port: server.port.toString(),
        username: server.username,
        description: server.description || '',
        authType: server.authType,
        password: '',
        privateKey: ''
      })
    }
  }, [server])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!server) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/servers/${server.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onServerUpdated()
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Failed to update server:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!server) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Server</DialogTitle>
          <DialogDescription>
            Update server configuration and credentials
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Server Name</Label>
              <Input
                id="name"
                placeholder="Production Server"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="root"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hostname">Hostname/IP</Label>
              <Input
                id="hostname"
                placeholder="192.168.1.100"
                value={formData.hostname}
                onChange={(e) => handleInputChange('hostname', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="22"
                value={formData.port}
                onChange={(e) => handleInputChange('port', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Main production server for web applications"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Authentication Method</Label>
            <Select
              value={formData.authType}
              onValueChange={(value) => handleInputChange('authType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select authentication method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PASSWORD">Password</SelectItem>
                <SelectItem value="PRIVATE_KEY">Private Key</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={formData.authType} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="PASSWORD" disabled>Password</TabsTrigger>
              <TabsTrigger value="PRIVATE_KEY" disabled>Private Key</TabsTrigger>
            </TabsList>
            
            <TabsContent value="PASSWORD" className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password (leave empty to keep current)"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </TabsContent>
            
            <TabsContent value="PRIVATE_KEY" className="space-y-2">
              <Label htmlFor="privateKey">Private Key</Label>
              <Textarea
                id="privateKey"
                placeholder="-----BEGIN RSA PRIVATE KEY----- (leave empty to keep current)"
                value={formData.privateKey}
                onChange={(e) => handleInputChange('privateKey', e.target.value)}
                rows={6}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Server
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}