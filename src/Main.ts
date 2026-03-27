import * as Plugin from 'iitcpluginkit'
import {DialogHelper} from './Helper/Dialog'

// @ts-expect-error we don't want to import JSON files :(
import plugin from '../plugin.json'

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const PLUGIN_NAME = plugin.name.replace('IITC plugin: ', '') as string
 
console.log(PLUGIN_NAME)
export class Main implements Plugin.Class {

    private dialogHelper: DialogHelper
    private dialog?: JQuery
    private filterValue = ''

    init() {
         
        console.log(`${PLUGIN_NAME} - ${VERSION}`)

         
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('./styles.css')

        this.dialogHelper = new DialogHelper(PLUGIN_NAME, 'Local Storage Editor')

        this.createButtons()
    }

    private createButtons(): void {
        IITC.toolbox.addButton({
            label: 'KStorageEditor',
            title: 'Local Storage Editor',
            id: `btn-${PLUGIN_NAME}`,
            action: this.showDialog
        })
    }

    private showDialog = (): void => {
        if (this.dialog) return

        try {
            this.dialog = this.dialogHelper.getDialog()
        } catch (error) {
            alert(error instanceof Error ? error.message : String(error))
            return
        }

        this.dialog.on('dialogclose', () => { this.dialog = undefined })

        this.setupEvents()
        this.refreshTable()
    }

    private setupEvents(): void {
        const prefix = PLUGIN_NAME
        const container = this.dialog!.find(`#${prefix}Container`)

        container.find(`#${prefix}Filter`).on('input', (event) => {
            this.filterValue = (event.target as HTMLInputElement).value.toLowerCase()
            this.refreshTable()
        })

        container.find(`#${prefix}AddBtn`).on('click', () => {
            this.dialogHelper.showEditForm('', '', true)
        })

        container.find(`#${prefix}Body`).on('click', '.ls-edit-btn', (event) => {
            const key = $(event.currentTarget).closest('tr').attr('data-key') ?? ''
            const value = localStorage.getItem(key) ?? ''
            this.dialogHelper.showEditForm(key, value, false)
        })

        container.find(`#${prefix}Body`).on('click', '.ls-delete-btn', (event) => {
            const key = $(event.currentTarget).closest('tr').attr('data-key') ?? ''
            if (confirm(`Delete "${key}"?`)) {
                localStorage.removeItem(key)
                this.refreshTable()
            }
        })

        container.find(`#${prefix}SaveBtn`).on('click', () => {
            const key = (container.find(`#${prefix}EditKey`).val() as string).trim()
            const value = container.find(`#${prefix}EditValue`).val() as string
            if (!key) {
                alert('Key cannot be empty')
                return
            }
            localStorage.setItem(key, value)
            this.dialogHelper.hideEditForm()
            this.refreshTable()
        })

        container.find(`#${prefix}CancelBtn`).on('click', () => {
            this.dialogHelper.hideEditForm()
        })
    }

    private refreshTable(): void {
        const items: {key: string, value: string}[] = []

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key === null) continue
            if (this.filterValue && !key.toLowerCase().includes(this.filterValue)) continue
            items.push({key, value: localStorage.getItem(key) ?? ''})
        }

        items.sort((a, b) => a.key.localeCompare(b.key))
        this.dialogHelper.renderItems(items)
    }
}

Plugin.Register(new Main, PLUGIN_NAME)
