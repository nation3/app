import { createContext, useContext, useState, useEffect } from 'react'

const ErrorContext = createContext([])

function ErrorProvider({ children }) {
  const [errors, setErrors] = useState([])
  const [count, setCount] = useState([])
  const addError = (newErrors) => {
    if (newErrors && newErrors[0]) {
      for (const error of newErrors) {
        setErrors([{ key: count, ...error }, ...errors])
        setCount(++count)
      }
    }
  }

  const removeError = (key) => {
    if (key > -1) {
      setErrors(errors.filter((error) => error.key !== key))
      setCount(--count)
    }
  }

  const context = { errors, addError, removeError }
  return (
    <ErrorContext.Provider value={context}>{children}</ErrorContext.Provider>
  )
}

function useErrorContext() {
  const errors = useContext(ErrorContext)
  if (errors === undefined) {
    throw new Error('useCount must be used within a CountProvider')
  }
  return errors
}

function handleErrors(context, errors) {
  useEffect(() => {
    context.addError(errors)
  }, errors)
}

export { ErrorProvider, useErrorContext, handleErrors }