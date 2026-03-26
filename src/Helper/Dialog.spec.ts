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
})
