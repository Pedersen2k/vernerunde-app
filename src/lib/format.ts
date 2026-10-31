const dateFmt = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('nb-NO', { hour: '2-digit', minute: '2-digit' })

export const formatDate = (t: number) => dateFmt.format(t)
export const formatDateTime = (t: number) => `${dateFmt.format(t)} kl. ${timeFmt.format(t)}`
