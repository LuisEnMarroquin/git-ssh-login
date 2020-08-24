const { getInput, setFailed } = require('@actions/core')
const { mkdirSync, writeFileSync } = require('fs')
const { context } = require('@actions/github')
const { execSync } = require('child_process')
const { homedir } = require('os')
const { join } = require('path')

try {
  let exec = (command) => {
    console.log('exec', command.length, command)
    let result = execSync(command, { encoding: 'utf-8' })
    console.log(result)
    return result
  }

  let userName = ''
  let userEmail = ''
  let home = homedir()
  let ORIGIN = getInput('ORIGIN')
  let SSHKEY = getInput('SSHKEY')
  let USERNM = getInput('USERNM')
  let sshFolder = join(home, '.ssh/')
  let sshConfig = join(home, '.ssh', 'config')
  let sshAccess = join(home, '.ssh', 'access')
  let user = (USERNM ? `  User ${USERNM}\n` : '')
  let payload = context ? context.payload || {} : {}
  let accessText = `Host remote\n  HostName ${ORIGIN}\n  IdentityFile ${sshAccess}\n  StrictHostKeyChecking no\n${user}`

  exec(`pwd`)
  console.log({ home })
  if (process.platform === 'darwin') exec(`rm -rf ${sshFolder}`)

  mkdirSync(sshFolder)
  writeFileSync(sshConfig, accessText)
  writeFileSync(sshAccess, SSHKEY)

  try {
    userName = payload.pusher ? (payload.pusher.name || userName) : userName
    userEmail = payload.pusher ? (payload.pusher.email || userEmail) : userEmail
  } catch (error) {
    console.error({ error })
  }

  if (process.platform !== 'win32') {
    exec(`chmod 755 ${sshFolder}`)
    exec(`chmod 600 ${sshAccess}`)
  }

  if (userName !== '') exec(`git config --global user.name "${userName}"`)
  if (userEmail !== '') exec(`git config --global user.email "${userEmail}"`)

  console.log({ payload })
} catch (error) {
  setFailed(error.message)
}
