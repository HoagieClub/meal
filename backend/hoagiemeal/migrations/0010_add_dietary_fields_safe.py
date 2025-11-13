# hoagiemeal/migrations/0010_add_dietary_fields_safe.py

from django.db import migrations


def add_dietary_fields_safely(apps, schema_editor):
    """Add dietary fields only if they don't exist."""
    
    with schema_editor.connection.cursor() as cursor:
        # List of fields to add: (column_name, sql_definition)
        fields_to_add = [
            ('is_vegetarian', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('is_vegan', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('is_halal', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('is_kosher', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('dietary_flags', "VARCHAR(50)[] DEFAULT '{}'"),
        ]
        
        for column_name, sql_definition in fields_to_add:
            # Check if column exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='menu_items' 
                    AND column_name=%s
                );
            """, [column_name])
            
            exists = cursor.fetchone()[0]
            
            if not exists:
                print(f"Adding column: {column_name}")
                cursor.execute(f"""
                    ALTER TABLE menu_items 
                    ADD COLUMN {column_name} {sql_definition};
                """)
            else:
                print(f"Column {column_name} already exists, skipping")
        
        # Add indexes if they don't exist
        indexes = [
            'idx_menu_items_is_vegetarian',
            'idx_menu_items_is_vegan',
            'idx_menu_items_is_halal',
            'idx_menu_items_is_kosher',
        ]
        
        for idx_name in indexes:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 
                    FROM pg_indexes 
                    WHERE indexname=%s
                );
            """, [idx_name])
            
            exists = cursor.fetchone()[0]
            
            if not exists:
                column_name = idx_name.replace('idx_menu_items_', '')
                print(f"Creating index: {idx_name}")
                cursor.execute(f"""
                    CREATE INDEX {idx_name} ON menu_items({column_name});
                """)
            else:
                print(f"Index {idx_name} already exists, skipping")


def reverse_migration(apps, schema_editor):
    """Remove dietary fields if rolling back."""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            ALTER TABLE menu_items 
            DROP COLUMN IF EXISTS is_vegetarian,
            DROP COLUMN IF EXISTS is_vegan,
            DROP COLUMN IF EXISTS is_halal,
            DROP COLUMN IF EXISTS is_kosher,
            DROP COLUMN IF EXISTS dietary_flags CASCADE;
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('hoagiemeal', '0009_customuser_dining_halls'),  # UPDATE THIS LINE
    ]

    operations = [
        migrations.RunPython(
            add_dietary_fields_safely,
            reverse_migration,
        ),
    ]