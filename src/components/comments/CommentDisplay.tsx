import { RouterOutput } from '~/utils/trpc'
import { CreateComment } from '~/components/comments/CreateComment'
import { useState } from 'react'
import useBlogUXStore from '~/store/blogUXStore'
import useQuestionsUXStore from '~/store/askQuestionsUXStore'
import { CreateBlogItem } from '~/components/blog/CreateBlogItem'
import { format } from 'date-fns'
import { standardDateFormat } from '~/utils/date'
import { MDRender } from '~/components/common/MDRender'
import { Button, Divider } from '@mui/material'

type CommentOutput = RouterOutput['comment']['commentTreeForAsk'][0]

interface CommentDisplayProps {
    comment: CommentOutput
}

export const CommentDisplay = ({ comment }: CommentDisplayProps) => {
    const { currentOpenQuestionId, setCurrentOpenQuestionIdId } = useQuestionsUXStore()

    return (
        <div className={'comment-container flex flex-col gap-1'}>
            <div className={'flex flex-col'}>
                <i>author: {comment.user.userName}</i>
                <i>created: {format(comment.createdAt ?? 0, standardDateFormat)}</i>
                <Divider />
                <MDRender content={comment.content ?? ''} />
            </div>
            {comment.children.map((comment) => {
                return <CommentDisplay key={comment.id} comment={comment} />
            })}

            {currentOpenQuestionId === comment.id ? (
                <div>
                    <CreateComment commentId={comment.id} />
                </div>
            ) : (
                <Button onClick={() => setCurrentOpenQuestionIdId(comment.id)} component="label">
                    Add comment
                </Button>
            )}
        </div>
    )
}