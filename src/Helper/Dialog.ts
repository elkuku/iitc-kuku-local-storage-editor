// @ts-expect-error "Import attributes are only supported when the --module option is set to esnext, nodenext, or preserve"
import dialogTemplate from '../tpl/dialog.hbs' with {type: 'text'}

import {HelperHandlebars} from '../../types/Types'

export class DialogHelper {

    private dialogElement?: JQuery

    public constructor(
        private pluginName: string,
        private title: string,
    ) {}

    public getDialog(): JQuery {
        const html = this.renderTemplate()

        this.dialogElement = window.dialog({
            id: this.pluginName,
            title: this.title,
            html,
            width: 800,
            height: 600,
            resizable: true,
            buttons: [],
        }).parent()

        return this.dialogElement
    }

    private renderTemplate(): string {
        const handlebars: HelperHandlebars | undefined = window.plugin?.HelperHandlebars

        if (!handlebars) {
            throw new Error(`${this.pluginName} requires the HelperHandlebars plugin`)
        }

        const template = handlebars.compile(dialogTemplate)
        return template({plugin: 'window.plugin.' + this.pluginName, prefix: this.pluginName})
    }

    public renderItems(items: {key: string, value: string}[]): void {
        if (!this.dialogElement) return

        const tbody = this.dialogElement.find(`#${this.pluginName}Body`)
        tbody.empty()

        if (items.length === 0) {
            tbody.append(
                $('<tr>').append(
                    $('<td>').attr('colspan', '3').addClass('ls-empty').text('No entries found')
                )
            )
            return
        }

        items.forEach(({key, value}) => {
            const displayValue = value.length > 80 ? value.slice(0, 80) + '…' : value
            const tr = $('<tr>').attr('data-key', key)
            tr.append($('<td>').addClass('ls-key').text(key))
            tr.append($('<td>').addClass('ls-value').text(displayValue))
            const actions = $('<td>').addClass('ls-actions')
            actions.append($('<button>').addClass('ls-edit-btn').text('Edit'))
            actions.append($('<button>').addClass('ls-delete-btn').text('Del'))
            tr.append(actions)
            tbody.append(tr)
        })
    }

    public showEditForm(key: string, value: string, isNew: boolean): void {
        if (!this.dialogElement) return

        const prefix = this.pluginName
        this.dialogElement.find(`#${prefix}EditKey`).val(key).prop('readonly', !isNew)
        this.dialogElement.find(`#${prefix}EditValue`).val(value)
        this.dialogElement.find(`#${prefix}EditForm`).show()
    }

    public hideEditForm(): void {
        if (!this.dialogElement) return
        this.dialogElement.find(`#${this.pluginName}EditForm`).hide()
    }
}
