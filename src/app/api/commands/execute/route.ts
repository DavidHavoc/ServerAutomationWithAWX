import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serverId, command } = body

    if (!serverId || !command) {
      return NextResponse.json(
        { error: 'Server ID and command are required' },
        { status: 400 }
      )
    }

    const server = await db.server.findUnique({
      where: { id: serverId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      )
    }

    if (server.status !== 'ONLINE') {
      return NextResponse.json(
        { error: 'Server is not online' },
        { status: 400 }
      )
    }

    // For demo purposes, use hardcoded user ID
    const userId = 'demo-user-id'

    // Create command log entry
    const commandLog = await db.commandLog.create({
      data: {
        command,
        status: 'RUNNING',
        serverId,
        executedBy: userId
      },
      include: {
        server: {
          select: {
            name: true,
            hostname: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Simulate command execution
    // In a real implementation, you would use SSH to execute the command
    const startTime = Date.now()
    
    // Simulate command execution time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 3000))
    
    const endTime = Date.now()
    const duration = endTime - startTime

    // Generate mock output based on command
    let output = ''
    let status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' = 'SUCCESS'

    if (command.includes('uname')) {
      output = 'Linux demo-server 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:52:09 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux'
    } else if (command.includes('df')) {
      output = `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   15G   33G  32% /
/dev/sdb1       200G   80G  110G  43% /data
tmpfs           7.8G     0  7.8G   0% /dev/shm`
    } else if (command.includes('free')) {
      output = `              total        used        free      shared  buff/cache   available
Mem:           15.6G       2.1G       10.2G       123M       3.3G       12.8G
Swap:          2.0G          0B       2.0G`
    } else if (command.includes('systemctl')) {
      output = `UNIT                           LOAD   ACTIVE SUB     DESCRIPTION
ssh.service                     loaded active running OpenSSH SSH daemon
nginx.service                   loaded active running A high performance web server
mysql.service                   loaded active running MySQL Community Server
docker.service                  loaded active running Docker Application Container Engine`
    } else if (command.includes('ps')) {
      output = `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.2  16856 10736 ?        Ss   10:00   0:01 /sbin/init
root         234  0.0  0.1  16920  9044 ?        Ss   10:00   0:00 /lib/systemd/systemd-journald
root         567  0.0  0.3  72128 23456 ?        Ssl  10:00   0:02 /usr/sbin/sshd -D`
    } else {
      output = `Command executed successfully: ${command}
Output generated at ${new Date().toISOString()}
This is a simulated output for demonstration purposes.`
      // Randomly fail some commands for realism
      if (Math.random() < 0.1) {
        status = 'FAILED'
        output = `Command failed: ${command}\nError: Command not found or permission denied`
      }
    }

    // Update command log with results
    const updatedLog = await db.commandLog.update({
      where: { id: commandLog.id },
      data: {
        output,
        status,
        endTime: new Date(),
        duration
      },
      include: {
        server: {
          select: {
            name: true,
            hostname: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Log the activity
    await db.activityLog.create({
      data: {
        action: 'EXECUTE_COMMAND',
        details: `Executed command "${command}" on "${server.name}"`,
        userId
      }
    })

    return NextResponse.json(updatedLog)
  } catch (error) {
    console.error('Failed to execute command:', error)
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    )
  }
}