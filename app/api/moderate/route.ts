import { NextRequest } from 'next/server'
import { classifyModerationRisk } from '@/lib/moderation-model'

interface ModerateRequest {
  content: string
}

interface ModerateResponse {
  score: number
  shouldBlock: boolean
  shouldFriction: boolean
  triggeredAttributes: string[]
  message: string
}

export async function POST(req: NextRequest): Promise<Response> {
  const body = (await req.json()) as ModerateRequest
  const content = body.content?.trim() ?? ''

  if (!content) {
    return Response.json({ error: 'No content provided' }, { status: 400 })
  }

  const prediction = classifyModerationRisk(content)
  const shouldBlock = prediction.score > 0.88
  const shouldFriction = prediction.score > 0.4 && prediction.score <= 0.88

  const result: ModerateResponse = {
    score: prediction.score,
    shouldBlock,
    shouldFriction,
    triggeredAttributes: prediction.triggeredAttributes,
    message: shouldBlock
      ? 'This content cannot be posted as written. Please revise it before sharing.'
      : shouldFriction
        ? 'This may feel hurtful or expose private details. Take one more look before posting.'
        : 'Looks good.',
  }

  return Response.json(result)
}
