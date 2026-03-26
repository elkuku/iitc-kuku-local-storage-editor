import {describe, it, expect, vi, afterEach} from 'vitest'

vi.mock('../tpl/dialog.hbs', () => ({default: ''}))

import {DialogHelper} from './Dialog'

describe('DialogHelper', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('throws when HelperHandlebars is not available', () => {
        const helper = new DialogHelper('test', 'Title')
        vi.stubGlobal('window', {plugin: {}})
        expect(() => helper.getDialog()).toThrow('test requires the HelperHandlebars plugin')
    })

    it('returns dialog element when HelperHandlebars is available', () => {
        const helper = new DialogHelper('test', 'Title')
        const mockHandlebars = {
            compile: vi.fn().mockReturnValue(() => '<div></div>'),
        }
        const mockDialog = vi.fn().mockReturnValue({
            parent: vi.fn().mockReturnValue({find: vi.fn().mockReturnValue({empty: vi.fn()})})
        })
        vi.stubGlobal('window', {
            plugin: {HelperHandlebars: mockHandlebars},
            dialog: mockDialog
        })

        // Mock jQuery $
        const mockJQuery = vi.fn().mockReturnValue({
            attr: vi.fn().mockReturnThis(),
            addClass: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnThis(),
            append: vi.fn().mockReturnThis(),
            empty: vi.fn().mockReturnThis(),
            find: vi.fn().mockReturnThis(),
        })
        vi.stubGlobal('$', mockJQuery)

        const result = helper.getDialog()
        expect(result).toBeDefined()
        expect(mockHandlebars.compile).toHaveBeenCalled()
        expect(mockDialog).toHaveBeenCalledWith(expect.objectContaining({
            id: 'test',
            title: 'Title'
        }))
    })

    it('renderItems renders items correctly', () => {
        const helper = new DialogHelper('test', 'Title')
        const mockTbody = {
            empty: vi.fn().mockReturnThis(),
            append: vi.fn().mockReturnThis(),
        }
        const mockDialogElement = {
            find: vi.fn().mockReturnValue(mockTbody)
        }
        // @ts-expect-error accessing private for testing
        helper.dialogElement = mockDialogElement

        const mockTd = {
            addClass: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnThis(),
            append: vi.fn().mockReturnThis(),
        }
        const mockTr = {
            attr: vi.fn().mockReturnThis(),
            append: vi.fn().mockReturnThis(),
        }
        const mockButton = {
            addClass: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnThis(),
        }

        const mockJQuery = vi.fn().mockImplementation((selector) => {
            if (selector === '<td>') return mockTd
            if (selector === '<tr>') return mockTr
            if (selector === '<button>') return mockButton
            return {
                append: vi.fn().mockReturnThis(),
                empty: vi.fn().mockReturnThis(),
            }
        })
        vi.stubGlobal('$', mockJQuery)

        helper.renderItems([{key: 'k1', value: 'v1'}, {key: 'k2', value: 'v2'.repeat(50)}])

        expect(mockTbody.empty).toHaveBeenCalled()
        expect(mockTbody.append).toHaveBeenCalledTimes(2)
        expect(mockTd.text).toHaveBeenCalledWith('k1')
        expect(mockTd.text).toHaveBeenCalledWith('v1')
        expect(mockTd.text).toHaveBeenCalledWith(expect.stringContaining('…')) // long value
    })

    it('showEditForm works correctly', () => {
        const helper = new DialogHelper('test', 'Title')
        const mockElement = {
            val: vi.fn().mockReturnThis(),
            prop: vi.fn().mockReturnThis(),
            show: vi.fn().mockReturnThis(),
        }
        const mockDialogElement = {
            find: vi.fn().mockReturnValue(mockElement)
        }
        // @ts-expect-error accessing private for testing
        helper.dialogElement = mockDialogElement

        helper.showEditForm('k', 'v', true)

        expect(mockDialogElement.find).toHaveBeenCalledWith('#testEditKey')
        expect(mockDialogElement.find).toHaveBeenCalledWith('#testEditValue')
        expect(mockDialogElement.find).toHaveBeenCalledWith('#testEditForm')
        expect(mockElement.val).toHaveBeenCalledWith('k')
        expect(mockElement.val).toHaveBeenCalledWith('v')
        expect(mockElement.show).toHaveBeenCalled()
    })

    it('renderItems renders empty message when items are empty', () => {
        const helper = new DialogHelper('test', 'Title')
        const mockTbody = {
            empty: vi.fn().mockReturnThis(),
            append: vi.fn().mockReturnThis(),
        }
        const mockDialogElement = {
            find: vi.fn().mockReturnValue(mockTbody)
        }
        // @ts-expect-error accessing private for testing
        helper.dialogElement = mockDialogElement

        const mockTd = {
            attr: vi.fn().mockReturnThis(),
            addClass: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnThis(),
        }
        const mockTr = {
            append: vi.fn().mockReturnThis(),
        }
        const mockJQuery = vi.fn().mockImplementation((selector) => {
            if (selector === '<td>') return mockTd
            if (selector === '<tr>') return mockTr
            return {}
        })
        vi.stubGlobal('$', mockJQuery)

        helper.renderItems([])

        expect(mockTbody.empty).toHaveBeenCalled()
        expect(mockTbody.append).toHaveBeenCalled()
        expect(mockTd.text).toHaveBeenCalledWith('No entries found')
    })

    it('methods return early when dialog is not initialized', () => {
        const helper = new DialogHelper('test', 'Title')
        // @ts-expect-error accessing private for testing
        expect(helper.dialogElement).toBeUndefined()

        expect(helper.renderItems([])).toBeUndefined()
        expect(helper.showEditForm('k', 'v', true)).toBeUndefined()
        expect(helper.hideEditForm()).toBeUndefined()
    })
})
