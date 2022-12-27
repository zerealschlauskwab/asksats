import { trpc } from '../utils/trpc'
import { NextPageWithLayout } from './_app'
import React, { useEffect } from 'react'
import { Header } from '~/components/layout/Header'
import useAuthStore from '~/store/useAuthStore'
import { Authenticate } from '~/components/modal/Authenticate'
import { Transact } from '~/components/modal/Transact'
import { Footer } from '~/components/layout/Footer'
import { InteractionModal } from '~/components/modal/InteractionModal'
import { EditUser } from '~/components/modal/EditUser'
import { AskList } from '~/components/ask/AskList'
import { CreateAsk } from '~/components/ask/CreateAsk'
import { CreateOffer } from '~/components/offer/CreateOffer'
import { useRouter } from 'next/router'
import { Ask } from '~/components/ask/Ask'
import useActionStore from '~/store/actionStore'
import { BumpList } from '~/components/ask/BumpList'
import { OfferList } from '~/components/ask/OfferList'
import { Logo } from '~/components/layout/Logo'
import { ImageView } from '~/components/common/ImageView'
import useMessageStore from '~/store/messageStore'
import { Sidebar } from '~/components/layout/Sidebar'
import { ToasterDisplay } from '~/components/common/Toaster'
import { useMedia } from 'use-media'
import useUXStore from '~/store/uxStore'
import { BlogList } from '~/components/blog/BlogList'
import { FileList } from '~/components/FileList'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import MenuIcon from '@mui/icons-material/Menu'
import { Button, createTheme, ThemeProvider } from '@mui/material'
import { WelcomeScreen } from '~/components/common/WelcomeScreen'

const IndexPage: NextPageWithLayout = () => {
    const { setUser, storeToken, storeLogin } = useAuthStore()
    const { mobileMenuOpen, setMobileMenuOpen } = useUXStore()
    const { currentModal, setCurrentModal } = useActionStore()
    const { visible } = useMessageStore()

    const [parent] = useAutoAnimate<HTMLDivElement>(/* optional config */)
    const router = useRouter()
    const isWide = useMedia({ minWidth: '1024px' }) // TODO: use mui and uninstall
    const utils = trpc.useContext()

    const theme = createTheme({
        components: {
            MuiButton: {
                styleOverrides: {
                    root: { borderRadius: 0 },
                },
                variants: [
                    {
                        props: { variant: 'preview' },
                        style: {
                            borderTop: '1px solid #ccc',
                            borderLeft: '1px solid #ccc',
                        },
                    },
                ],
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: { borderRadius: 0 },
                },
            },
        },
        palette: {},
    }) // TODO: extract to theme.ts

    const routerPath = (path: string): string => {
        const subPath = path.split('/')[2]
        if (!subPath) {
            return 'timeline'
        }
        return path.split('/')[2] ?? ''
    }

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            storeLogin(token)
        }
        if (storeToken) {
            utils.user.getMe.fetch().then((data) => {
                setUser(data)
                setCurrentModal('none')
            })
        }
    }, [storeToken])

    return (
        <ThemeProvider theme={theme}>
            <div className={'index-background flex max-h-screen flex-col gap-1 p-4 lg:flex-row lg:gap-4'}>
                <div className={'flex w-full flex-col gap-4 lg:w-4/12'}>
                    <header className={'flex w-full flex-row gap-1 lg:gap-4'}>
                        {!isWide && (
                            <Button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                <MenuIcon />
                            </Button>
                        )}
                        {isWide && <Logo />}
                        <Header />
                    </header>
                    {(isWide || mobileMenuOpen) && (
                        <div className={'primary-container grow'}>
                            <Sidebar />
                        </div>
                    )}
                    {isWide && (
                        <footer className={'primary-container'}>
                            <Footer />
                        </footer>
                    )}
                </div>
                <main className={'grow overflow-hidden'} ref={parent}>
                    {
                        {
                            single: <Ask slug={router.query.slug as string} />,
                            timeline: <AskList />,
                            tag: <AskList />,
                            bumps: <BumpList />,
                            offers: <OfferList />,
                            user: <AskList />,
                            files: <FileList />,
                            blog: <BlogList />,
                        }[routerPath(router.asPath)]
                    }
                </main>
                {
                    {
                        authenticate: (
                            <InteractionModal title={'Authenticate'}>
                                <Authenticate />
                            </InteractionModal>
                        ),
                        transact: (
                            <InteractionModal title={'Transact'}>
                                <Transact />
                            </InteractionModal>
                        ),
                        editUser: (
                            <InteractionModal title={'Edit User'}>
                                <EditUser />
                            </InteractionModal>
                        ),
                        createAsk: (
                            <InteractionModal title={'Create Ask'}>
                                <CreateAsk />
                            </InteractionModal>
                        ),
                        addOffer: (
                            <InteractionModal title={'Add Offer'}>
                                <CreateOffer />
                            </InteractionModal>
                        ),
                        viewImage: (
                            <InteractionModal title={'Image'}>
                                <ImageView />
                            </InteractionModal>
                        ),
                        welcome: (
                            <InteractionModal title={'Welcome!'}>
                                <WelcomeScreen />
                            </InteractionModal>
                        ),
                        none: null,
                    }[currentModal]
                }
                {visible && <ToasterDisplay />}
            </div>
        </ThemeProvider>
    )
}

export default IndexPage
