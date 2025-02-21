import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { hash } from "bcrypt"

export async function POST() {
  try {
    // Create initial database schema
    const { error: schemaError } = await supabaseAdmin.rpc("create_initial_schema", {
      sql: `
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Create users table
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create leave_types table
        CREATE TABLE IF NOT EXISTS leave_types (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          days_allowed INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create leave_requests table
        CREATE TABLE IF NOT EXISTS leave_requests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id),
          leave_type_id UUID REFERENCES leave_types(id),
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          reason TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          manager_approval_status VARCHAR(50) DEFAULT 'pending',
          manager_id UUID REFERENCES users(id),
          manager_notes TEXT,
          hr_approval_status VARCHAR(50) DEFAULT 'pending',
          hr_officer_id UUID REFERENCES users(id),
          hr_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create notifications table
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id),
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50),
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert default leave types
        INSERT INTO leave_types (name, description, days_allowed) VALUES
        ('Vacation Leave', 'Annual vacation leave', 15),
        ('Sick Leave', 'Medical-related leave', 15),
        ('Emergency Leave', 'Urgent personal matters', 5),
        ('Bereavement Leave', 'Death in immediate family', 5)
        ON CONFLICT DO NOTHING;

        -- Create courses table
        CREATE TABLE IF NOT EXISTS courses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          code VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          academic_year VARCHAR(20),
          semester VARCHAR(20),
          level VARCHAR(50), -- elementary, junior_high, senior_high, college
          teacher_id UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) DEFAULT 'active'
        );

        -- Create assignments table
        CREATE TABLE IF NOT EXISTS assignments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          course_id UUID REFERENCES courses(id),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(50), -- written_works, performance_tasks, quarterly_assessment, prelim, midterm, semifinal, final
          due_date TIMESTAMP WITH TIME ZONE,
          total_points INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create attendance table
        CREATE TABLE IF NOT EXISTS attendance (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          course_id UUID REFERENCES courses(id),
          student_id UUID REFERENCES users(id),
          date DATE NOT NULL,
          status VARCHAR(20), -- present, late, absent
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create grades table
        CREATE TABLE IF NOT EXISTS grades (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          course_id UUID REFERENCES courses(id),
          student_id UUID REFERENCES users(id),
          assignment_id UUID REFERENCES assignments(id),
          score DECIMAL,
          feedback TEXT,
          status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, approved
          approved_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create course_students table
        CREATE TABLE IF NOT EXISTS course_students (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          course_id UUID REFERENCES courses(id),
          student_id UUID REFERENCES users(id),
          enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) DEFAULT 'enrolled',
          UNIQUE(course_id, student_id)
        );

        -- Create grade_periods table
        CREATE TABLE IF NOT EXISTS grade_periods (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          course_id UUID REFERENCES courses(id),
          name VARCHAR(50), -- Q1, Q2, Q3, Q4 for basic ed; Prelim, Midterm, Semifinal, Final for college
          start_date DATE,
          end_date DATE,
          deadline DATE,
          status VARCHAR(50) DEFAULT 'upcoming',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

    -- Create fee_types table
    CREATE TABLE IF NOT EXISTS fee_types (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      amount DECIMAL(10,2) NOT NULL,
      category VARCHAR(50), -- tuition, miscellaneous, laboratory, etc.
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create invoices table
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID REFERENCES users(id),
      total_amount DECIMAL(10,2) NOT NULL,
      balance DECIMAL(10,2) NOT NULL,
      due_date DATE,
      status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid
      academic_year VARCHAR(20),
      semester VARCHAR(20),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create invoice_items table
    CREATE TABLE IF NOT EXISTS invoice_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      invoice_id UUID REFERENCES invoices(id),
      fee_type_id UUID REFERENCES fee_types(id),
      amount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create payments table
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      invoice_id UUID REFERENCES invoices(id),
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50), -- cash, check, online
      reference_number VARCHAR(100),
      notes TEXT,
      processed_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create queue table
    CREATE TABLE IF NOT EXISTS queue (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      number INTEGER NOT NULL,
      student_id UUID REFERENCES users(id),
      purpose VARCHAR(100),
      status VARCHAR(50) DEFAULT 'waiting', -- waiting, serving, completed, cancelled
      window_number INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE
    );

    -- Create financial_reports table
    CREATE TABLE IF NOT EXISTS financial_reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      report_type VARCHAR(50), -- daily, monthly, quarterly, annual
      start_date DATE,
      end_date DATE,
      total_collections DECIMAL(10,2),
      generated_by UUID REFERENCES users(id),
      status VARCHAR(50) DEFAULT 'draft', -- draft, final
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create report_items table
    CREATE TABLE IF NOT EXISTS report_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      report_id UUID REFERENCES financial_reports(id),
      category VARCHAR(50),
      amount DECIMAL(10,2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert default fee types
    INSERT INTO fee_types (name, description, amount, category) VALUES
    ('Tuition Fee', 'Basic tuition fee per semester', 25000.00, 'tuition'),
    ('Laboratory Fee', 'Computer laboratory fee', 5000.00, 'laboratory'),
    ('Library Fee', 'Library services fee', 2000.00, 'miscellaneous'),
    ('Registration Fee', 'Semester registration fee', 1500.00, 'miscellaneous')
    ON CONFLICT DO NOTHING;

    -- Create rfid_cards table
    CREATE TABLE IF NOT EXISTS rfid_cards (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      card_number VARCHAR(50) UNIQUE NOT NULL,
      user_id UUID REFERENCES users(id),
      type VARCHAR(50), -- student, personnel, visitor, parent
      status VARCHAR(20) DEFAULT 'active', -- active, inactive, lost
      issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create access_logs table
    CREATE TABLE IF NOT EXISTS access_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      rfid_card_id UUID REFERENCES rfid_cards(id),
      access_point VARCHAR(50), -- gate1, gate2, etc.
      direction VARCHAR(10), -- in, out
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      verified_by UUID REFERENCES users(id)
    );

    -- Create visitors table
    CREATE TABLE IF NOT EXISTS visitors (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      contact_number VARCHAR(20),
      purpose VARCHAR(255),
      visiting VARCHAR(255), -- person or department being visited
      id_type VARCHAR(50),
      id_number VARCHAR(100),
      rfid_card_id UUID REFERENCES rfid_cards(id),
      status VARCHAR(20) DEFAULT 'active', -- active, completed
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE
    );

    -- Create traffic_reports table
    CREATE TABLE IF NOT EXISTS traffic_reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      report_date DATE NOT NULL,
      student_count INTEGER DEFAULT 0,
      personnel_count INTEGER DEFAULT 0,
      visitor_count INTEGER DEFAULT 0,
      parent_count INTEGER DEFAULT 0,
      total_entries INTEGER DEFAULT 0,
      total_exits INTEGER DEFAULT 0,
      generated_by UUID REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create access_points table
    CREATE TABLE IF NOT EXISTS access_points (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(50) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'active', -- active, inactive, maintenance
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert default access points
    INSERT INTO access_points (name, description) VALUES
    ('Main Gate', 'Main entrance gate'),
    ('Back Gate', 'Back entrance gate'),
    ('Faculty Entrance', 'Faculty and staff entrance')
    ON CONFLICT DO NOTHING;
      `,
    })

    if (schemaError) {
      throw schemaError
    }

    // Create superadmin account
    const hashedPassword = await hash("long2006", 10)

    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        email: "eduardcaayaman@gmail.com",
        password_hash: hashedPassword,
        role: "superadmin",
        first_name: "Eduard",
        last_name: "Caayaman",
      })
      .select()
      .single()

    if (userError) {
      throw userError
    }

    return NextResponse.json({
      message: "Database setup completed successfully",
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Failed to setup database" }, { status: 500 })
  }
}

