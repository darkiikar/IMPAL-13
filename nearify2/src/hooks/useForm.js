import { useState } from 'react'

/**
 * useForm — custom hook untuk validasi form
 * @param {Object} initialValues - nilai awal field
 * @param {Function} validate - fungsi validasi, return object error
 */
export function useForm(initialValues, validate) {
  const [values, setValues]   = useState(initialValues)
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValues = {
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    }
    setValues(newValues)

    // Real-time validasi hanya field yang sudah pernah disentuh
    if (touched[name] && validate) {
      const errs = validate(newValues)
      setErrors(prev => ({ ...prev, [name]: errs[name] }))
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    if (validate) {
      const errs = validate(values)
      setErrors(prev => ({ ...prev, [name]: errs[name] }))
    }
  }

  const handleSubmit = (onSubmit) => async (e) => {
    e.preventDefault()

    // Tandai semua field sebagai touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }), {}
    )
    setTouched(allTouched)

    const errs = validate ? validate(values) : {}
    setErrors(errs)

    if (Object.keys(errs).length === 0) {
      setLoading(true)
      try {
        await onSubmit(values)
      } finally {
        setLoading(false)
      }
    }
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return { values, errors, touched, loading, handleChange, handleBlur, handleSubmit, reset }
}
