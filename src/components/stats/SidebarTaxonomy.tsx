import { trpc } from '~/utils/trpc'
import { TagPill } from '~/components/common/TagPill'
import { ChangeEvent, useState } from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import { Autocomplete, Checkbox, TextField, Typography } from '@mui/material'

interface SidebarTaxonomyProps {}

export const SidebarTaxonomy = ({}: SidebarTaxonomyProps) => {
    const { data: topTagsData } = trpc.taxonomy.topTags.useQuery()
    const { data: excludedTagsData } = trpc.taxonomy.excludedTagsForUser.useQuery()
    const excludeTagMutation = trpc.taxonomy.addExcludedTagForUser.useMutation()
    const unExcludeTagMutation = trpc.taxonomy.unExcludeTagForUser.useMutation()
    const utils = trpc.useContext()

    const [possibleTags, setPossibleTags] = useState<string[]>([])

    const handleUncheckTag = async (tagName: string) => {
        await unExcludeTagMutation.mutateAsync({ tagName })
        utils.taxonomy.invalidate()
    }

    const handleAddTag = async (tagName: string) => {
        await excludeTagMutation.mutateAsync({ tagName })
        utils.taxonomy.invalidate()
    }

    const handleSearchInput = async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const searchTerm = e.target.value
        console.log(searchTerm)
        await utils.taxonomy.searchTags.fetch({ search: searchTerm }).then((data) => {
            const tagResults = data.map((tag) => tag.name)
            const contains = tagResults.includes(searchTerm)
            if (!contains) {
                setPossibleTags([searchTerm, ...tagResults])
            } else {
                setPossibleTags(tagResults)
            }
        })
    }

    return (
        <div className={'flex flex-col gap-2'}>
            <div className={'emphasis-container'}>
                <b>top tags:</b>
                <div className={'flex flex-col gap-2'}>
                    {topTagsData?.map((tag, index) => {
                        return (
                            <div key={index} className={'flex flex-row items-center justify-between gap-1'}>
                                <TagPill key={tag.id} tagValue={tag.name} />
                                <div>{tag.askCount}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className={'emphasis-container overflow-x-auto'}>
                <b>my excluded tags:</b>
                <List>
                    {excludedTagsData?.map((tag, index) => {
                        return (
                            <ListItem key={index} disablePadding>
                                <ListItemButton>
                                    <ListItemIcon>
                                        <Checkbox checked={true} onChange={() => handleUncheckTag(tag.name)} />
                                    </ListItemIcon>
                                    <TagPill key={tag.id} tagValue={tag.name} />
                                </ListItemButton>
                            </ListItem>
                        )
                    })}
                </List>
                <Autocomplete
                    disablePortal
                    id="combo-box-demo"
                    options={possibleTags}
                    sx={{ width: 300 }}
                    renderInput={(params) => (
                        <TextField {...params} label="Add a tag" onChange={(e) => handleSearchInput(e)} />
                    )}
                    renderOption={(props, option) => {
                        return <Typography onClick={() => handleAddTag(option)}>{option}</Typography>
                    }}
                />
            </div>
        </div>
    )
}