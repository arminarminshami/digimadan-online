import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getThreadsForUser,
  getMessages,
  sendMessage,
  markThreadMessagesRead,
  subscribeToThreadMessages,
} from '../../services/chatService'
import { LoadingBlock, EmptyBlock } from '../../components/StatusBlocks'
import './DashboardMessages.css'

export default function DashboardMessages({ user }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeThreadId = searchParams.get('thread')
  const [threads, setThreads] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    let mounted = true
    getThreadsForUser(user.id)
      .then((data) => {
        if (!mounted) return
        setThreads(data)
        if (!activeThreadId && data.length > 0) {
          const next = new URLSearchParams(searchParams)
          next.set('thread', data[0].id)
          setSearchParams(next)
        }
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!activeThreadId) return
    let mounted = true

    getMessages(activeThreadId).then((data) => mounted && setMessages(data))
    markThreadMessagesRead(activeThreadId, user.id).catch(() => {})

    const unsubscribe = subscribeToThreadMessages(activeThreadId, (newMsg) => {
      setMessages((prev) => [...prev, newMsg])
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [activeThreadId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function selectThread(id) {
    const next = new URLSearchParams(searchParams)
    next.set('thread', id)
    setSearchParams(next)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || !activeThreadId) return
    const content = text
    setText('')
    await sendMessage({ threadId: activeThreadId, senderUserId: user.id, content })
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری گفتگوها..." />

  return (
    <div className="dashboard-messages">
      <div className="messages-layout">
        <aside className="messages-threads">
          {threads.length === 0 ? (
            <EmptyBlock title="هنوز گفتگویی ندارید" hint="از صفحه‌ی یک آگهی، گفتگو را شروع کنید." />
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                className={'messages-thread-item' + (t.id === activeThreadId ? ' messages-thread-item--active' : '')}
                onClick={() => selectThread(t.id)}
              >
                {t.ads?.title || 'آگهی'}
              </button>
            ))
          )}
        </aside>

        <section className="messages-conversation">
          {!activeThreadId ? (
            <EmptyBlock title="یک گفتگو را انتخاب کنید" />
          ) : (
            <>
              <div className="messages-conversation__list">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      'messages-bubble' + (m.sender_user_id === user.id ? ' messages-bubble--mine' : '')
                    }
                  >
                    {m.content}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form className="messages-input" onSubmit={handleSend}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                />
                <button type="submit" className="btn btn-primary btn-sm">ارسال</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
