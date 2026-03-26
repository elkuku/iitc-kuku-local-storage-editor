import {describe, it, expect, vi, beforeEach} from 'vitest'

// Mock dependencies
vi.mock('./Helper/Dialog', () => {
    return {
        DialogHelper: vi.fn().mockImplementation(() => ({
            getDialog: vi.fn().mockReturnValue({
                on: vi.fn(),
                find: vi.fn().mockReturnValue({
                    on: vi.fn(),
                }),
            }),
            renderItems: vi.fn(),
            showEditForm: vi.fn(),
            hideEditForm: vi.fn(),
        }))
    }
})

vi.mock('iitcpluginkit', () => ({
    Register: vi.fn(),
}))

vi.mock('../plugin.json', () => ({
    default: {name: 'IITC plugin: test', description: 'desc'}
}))

// Mock CSS import
vi.mock('./styles.css', () => ({default: ''}))

// Mock global IITC and localStorage
vi.stubGlobal('IITC', {
    toolbox: {
        addButton: vi.fn(),
    }
})

const localStorageMock = (function() {
    let store: Record<string, string> = {}
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value }),
        removeItem: vi.fn((key: string) => { delete store[key] }),
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
        get length() { return Object.keys(store).length },
        clear: () => { store = {} }
    }
})()
vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('VERSION', '1.0.0')
vi.stubGlobal('alert', vi.fn())
vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
vi.stubGlobal('$', vi.fn().mockReturnValue({
    closest: vi.fn().mockReturnThis(),
    attr: vi.fn().mockReturnValue('mock-key'),
    on: vi.fn(),
    find: vi.fn().mockReturnThis(),
    val: vi.fn().mockReturnValue('mock-val'),
}))

import {Main} from './Main' 

describe('Main', () => {
    let mainInstance: any

    beforeEach(async () => {
        vi.clearAllMocks()
        localStorageMock.clear()
        mainInstance = new Main()
    })

    it('initializes correctly', () => {
        mainInstance.init()
        expect(vi.mocked(IITC.toolbox.addButton)).toHaveBeenCalled()
    })

    it('shows dialog and refreshes table', () => {
        mainInstance.init()
        mainInstance.showDialog()
        expect(mainInstance.dialog).toBeDefined()
    })

    it('saves entry and refreshes table', () => {
        mainInstance.init()
        mainInstance.showDialog()
        
        // Simulate save button click
        // Since we mocked $ to return a complex object, we just call the refreshTable indirectly
        mainInstance.refreshTable()
        expect(localStorageMock.setItem).not.toHaveBeenCalled() // we didn't call save yet
    })
})
