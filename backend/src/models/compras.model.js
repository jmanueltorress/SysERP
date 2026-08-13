import pool from '../config/database.js'

export const obtenerOrdenesCompra = async () => {
  const [rows] = await pool.query(`
    SELECT
      oc.id,
      oc.folio,
      p.nombre AS proveedor,
      oc.fecha_orden,
      oc.fecha_entrega_estimada,
      oc.total,
      oc.estado
    FROM ordenes_compra oc
    INNER JOIN proveedores p
      ON p.id = oc.proveedor_id
    ORDER BY oc.id DESC
  `)

  return rows
}