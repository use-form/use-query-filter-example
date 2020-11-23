import { useState, useLayoutEffect, createContext, useContext } from 'react'

type FilterContextType<TInputs> = [
   TInputs,
   {
      set: (values: Partial<TInputs> | ((values: TInputs) => TInputs)) => void
      reset: (fn?: (e: TInputs) => void) => void
   },
]

function removeEmptyProperties<T>(object: T) {
   return Object.keys(object).reduce<T>((acc, ac) => {
      if (
         typeof (object as any)[ac] !== 'boolean' &&
         (!(object as any)[ac] || (object as any)[ac] === '')
      ) {
         return acc
      }
      return {
         ...acc,
         [ac]: (object as any)[ac],
      }
   }, Object.assign({}))
}

export function useQueryFilter<
   TFilter extends object
>(
   initialState: TFilter,
   callbackOnInit?: (state: TFilter) => void,
): FilterContextType<TFilter> {
   const [filter, setFilter] = useState<TFilter>(
      parseObjectFilter(new URLSearchParams(window.location.search)),
   )

   function parseObjectFilter(otherParams: any) {
      return Array.from(otherParams.keys()).reduce<TFilter>(
         (acc, ac, index) => {
            const value = Array.from(otherParams.values())[index] as string

            if (!isNaN(parseInt(value)) && !value.includes('-')) {
               return {
                  ...acc,
                  [ac as string]: parseInt(value),
               }
            }

            return {
               ...acc,
               [ac as string]: value,
            }
         },
         Object.assign({}),
      )
   }

   function set(tvalue: Partial<TFilter> | ((filter: TFilter) => TFilter)) {
      const value = typeof tvalue === 'function' ? tvalue(filter) : tvalue

      const filteredEmpty = removeEmptyProperties({ ...filter, ...value })

      const params = new URLSearchParams(filteredEmpty as any)

      setFilter((state) => ({ ...state, ...value }))

      window.history.replaceState(
         {},
         '',
         `${window.location.pathname}?${params}`,
      )
   }

   async function reset(fn?: (e: TFilter) => void) {
      setFilter(initialState)

      const params = new URLSearchParams(initialState as {})

      window.history.replaceState(
         {},
         '',
         `${window.location.pathname}?${params}`,
      )

      return fn?.(initialState)
   }

   useLayoutEffect(() => {
      const urlSearch = window.location.search
      const params = parseObjectFilter(new URLSearchParams(urlSearch))
      if (!!urlSearch) {
         setFilter(params)
         callbackOnInit?.(params)
      } else {
         set({ ...params, ...initialState })
         callbackOnInit?.({ ...params, ...initialState })
         //setFilter(initialState)
      }
      //eslint-disable-next-line react-hooks/exhaustive-deps
   }, [])

   // useLayoutEffect(() => {
   //    //set({ ...filter, page: 1 })
   //    // eslint-disable-next-line react-hooks/exhaustive-deps
   // }, [filter.limit])

   return [
      filter,
      {
         set,
         reset,
      },
   ]
}

export const FilterContext = createContext<FilterContextType<any>>([
   {},
   {
      set: () => {},
      reset: () => {},
   },
] as any)

export const FilterProvider = FilterContext.Provider
export const FilterConsumer = FilterContext.Consumer

export function useFilterContext<Values>() {
   const filter = useContext<FilterContextType<Values>>(FilterContext)

   console.log(filter)

   if (!filter) {
      throw new Error(
         'Filter cannot be undefined, please verify you are calling useFilterContext() as child of a Filter',
      )
   }

   return filter
}
