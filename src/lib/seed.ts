import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

export async function seedDemoData() {
  try {
    // Create demo admin user
    const adminPassword = await hash('admin123', 10)
    const adminUser = await db.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        passwordHash: adminPassword
      }
    })

    // Create demo regular user
    const userPassword = await hash('user123', 10)
    const regularUser = await db.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER',
        passwordHash: userPassword
      }
    })

    // Create demo servers
    const server1 = await db.server.upsert({
      where: { id: 'server-1' },
      update: {},
      create: {
        id: 'server-1',
        name: 'Production Web Server',
        hostname: '192.168.1.100',
        port: 22,
        username: 'admin',
        description: 'Main production server for web applications',
        status: 'ONLINE',
        authType: 'PASSWORD',
        password: await hash('serverpass123', 10),
        addedBy: adminUser.id,
        lastChecked: new Date()
      }
    })

    const server2 = await db.server.upsert({
      where: { id: 'server-2' },
      update: {},
      create: {
        id: 'server-2',
        name: 'Database Server',
        hostname: '192.168.1.101',
        port: 22,
        username: 'dbadmin',
        description: 'MySQL database server',
        status: 'ONLINE',
        authType: 'PASSWORD',
        password: await hash('dbpass123', 10),
        addedBy: adminUser.id,
        lastChecked: new Date()
      }
    })

    const server3 = await db.server.upsert({
      where: { id: 'server-3' },
      update: {},
      create: {
        id: 'server-3',
        name: 'Development Server',
        hostname: '192.168.1.102',
        port: 22,
        username: 'dev',
        description: 'Development and testing environment',
        status: 'OFFLINE',
        authType: 'PASSWORD',
        password: await hash('devpass123', 10),
        addedBy: regularUser.id,
        lastChecked: new Date()
      }
    })

    // Create demo command logs
    const demoCommands = [
      {
        command: 'uname -a',
        output: 'Linux prod-server 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:52:09 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux',
        status: 'SUCCESS' as const,
        serverId: server1.id,
        executedBy: adminUser.id,
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(Date.now() - 3595000),
        duration: 5000
      },
      {
        command: 'df -h',
        output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   15G   33G  32% /\n/dev/sdb1       200G   80G  110G  43% /data',
        status: 'SUCCESS' as const,
        serverId: server2.id,
        executedBy: adminUser.id,
        startTime: new Date(Date.now() - 7200000), // 2 hours ago
        endTime: new Date(Date.now() - 7198000),
        duration: 2000
      },
      {
        command: 'systemctl status nginx',
        output: '● nginx.service - A high performance web server\n   Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)\n   Active: active (running) since Tue 2024-01-15 10:30:00 UTC; 2h ago',
        status: 'SUCCESS' as const,
        serverId: server1.id,
        executedBy: regularUser.id,
        startTime: new Date(Date.now() - 1800000), // 30 minutes ago
        endTime: new Date(Date.now() - 1797000),
        duration: 3000
      }
    ]

    for (const cmd of demoCommands) {
      await db.commandLog.upsert({
        where: { id: `cmd-${cmd.command.replace(/\s+/g, '-')}` },
        update: {},
        create: cmd
      })
    }

    // Create demo activity logs
    const demoActivities = [
      {
        action: 'CREATE_SERVER',
        details: 'Created server "Production Web Server" at 192.168.1.100:22',
        userId: adminUser.id,
        timestamp: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        action: 'CREATE_SERVER',
        details: 'Created server "Database Server" at 192.168.1.101:22',
        userId: adminUser.id,
        timestamp: new Date(Date.now() - 43200000) // 12 hours ago
      },
      {
        action: 'EXECUTE_COMMAND',
        details: 'Executed command "uname -a" on "Production Web Server"',
        userId: adminUser.id,
        timestamp: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        action: 'EXECUTE_COMMAND',
        details: 'Executed command "systemctl status nginx" on "Production Web Server"',
        userId: regularUser.id,
        timestamp: new Date(Date.now() - 1800000) // 30 minutes ago
      },
      {
        action: 'TEST_CONNECTION',
        details: 'Tested connection to "Production Web Server" - Result: ONLINE',
        userId: adminUser.id,
        timestamp: new Date(Date.now() - 900000) // 15 minutes ago
      }
    ]

    for (const activity of demoActivities) {
      await db.activityLog.create({
        data: activity
      })
    }

    console.log('Demo data seeded successfully!')
    return { success: true }
  } catch (error) {
    console.error('Failed to seed demo data:', error)
    return { success: false, error }
  }
}