import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrders() {
  console.log('Checking orders...\n')
  
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('Error:', countError.message)
    return
  }
  
  console.log('Total orders:', count)
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, app_users(full_name, email), order_items(*)')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error:', error.message)
    return
  }
  
  console.log('\nRecent orders:')
  orders.forEach(order => {
    console.log(`- Order ${order.order_number}: ${order.app_users?.full_name} - $${order.total_amount}`)
  })
}

checkOrders()
