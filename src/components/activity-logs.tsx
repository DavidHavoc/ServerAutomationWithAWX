'use client'

import { useState, useEffect } from 'react'
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
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Activity, 
  Search, 
  RefreshCw, 
  User, 
  Server, 
  Terminal,
  Settings,
  Filter
} from 'lucide-react'

interface ActivityLog {
  id: string
  action: string
  details?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  user: {
    name: string
    email: string
  }
}

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, searchTerm, actionFilter])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/logs/activity')
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = logs

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(actionFilter.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }

  const getActionIcon = (action: string) => {
    if (action.includes('server')) {
      return <Server className="h-4 w-4" />
    } else if (action.includes('command')) {
      return <Terminal className="h-4 w-4" />
    } else if (action.includes('user')) {
      return <User className="h-4 w-4" />
    } else {
      return <Activity className="h-4 w-4" />
    }
  }

  const getActionBadge = (action: string) => {
    const color = action.includes('CREATE') || action.includes('ADD') ? 'default' :
                  action.includes('DELETE') || action.includes('REMOVE') ? 'destructive' :
                  action.includes('UPDATE') || action.includes('EDIT') ? 'secondary' :
                  'outline'

    return <Badge variant={color}>{action}</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>
                Track all user actions and system events
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="EXECUTE">Execute</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredLogs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{log.user.name}</div>
                            <div className="text-sm text-muted-foreground">{log.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          {getActionBadge(log.action)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.details && (
                          <div className="text-sm truncate" title={log.details}>
                            {log.details}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ipAddress || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {logs.length === 0 ? 'No activity logs' : 'No matching logs'}
              </h3>
              <p className="text-muted-foreground">
                {logs.length === 0 
                  ? 'Activity will appear here as users interact with the system'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}